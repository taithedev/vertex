create schema if not exists private;

create or replace function private.vertex_is_staff(required_capability text default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.vertex_staff_roles s
    where s.user_id = (select auth.uid())
      and (
        s.role = 'owner'
        or required_capability is null
        or required_capability = any(s.capabilities)
      )
  );
$$;

revoke all on function private.vertex_is_staff(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.vertex_is_staff(text) to authenticated;

create or replace function private.vertex_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  base_username text;
  candidate text;
  suffix integer := 1;
  display_name text;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', ''), '[^a-z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then
    base_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;
  base_username := left(base_username, 24);
  candidate := base_username;

  while exists (select 1 from public.vertex_profiles p where p.username = candidate) loop
    candidate := left(base_username, greatest(3, 24 - char_length(suffix::text) - 1)) || '_' || suffix::text;
    suffix := suffix + 1;
  end loop;

  display_name := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), candidate);

  insert into public.vertex_profiles(user_id, username, display_name)
  values (new.id, candidate, left(display_name, 40))
  on conflict (user_id) do nothing;

  insert into public.vertex_currency_accounts(user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists vertex_auth_user_created on auth.users;
create trigger vertex_auth_user_created
after insert on auth.users
for each row execute function private.vertex_handle_new_user();

create or replace function private.vertex_guard_game_status()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  is_staff boolean;
begin
  if new.status = old.status then
    return new;
  end if;

  is_staff := private.vertex_is_staff(null);

  if is_staff then
    return new;
  end if;

  if auth.uid() is null or auth.uid() <> new.creator_id then
    raise exception 'You are not allowed to change this game status.';
  end if;

  if old.status = 'draft' and new.status = 'pending_review' then
    return new;
  end if;

  if old.status = 'pending_review' and new.status = 'draft' then
    return new;
  end if;

  raise exception 'Only Vertex staff can approve, pause, decline, or remove games.';
end;
$$;

drop trigger if exists vertex_guard_game_status on public.vertex_games;
create trigger vertex_guard_game_status
before update on public.vertex_games
for each row execute function private.vertex_guard_game_status();

create table if not exists public.vertex_game_comments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000 and length(btrim(content)) > 0),
  moderation_state text not null default 'visible' check (moderation_state in ('visible','flagged','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vertex_marketplace_purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.vertex_marketplace_items(id) on delete restrict,
  price bigint not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_game_analytics_daily (
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  day date not null,
  visits bigint not null default 0,
  unique_players bigint not null default 0,
  peak_concurrent bigint not null default 0,
  browser_sessions bigint not null default 0,
  desktop_sessions bigint not null default 0,
  primary key (game_id, day)
);

create index if not exists vertex_game_comments_game_created on public.vertex_game_comments(game_id, created_at desc);
create index if not exists vertex_marketplace_purchases_buyer on public.vertex_marketplace_purchases(buyer_id, created_at desc);
create index if not exists vertex_game_analytics_game_day on public.vertex_game_analytics_daily(game_id, day desc);

alter table public.vertex_game_comments enable row level security;
alter table public.vertex_marketplace_purchases enable row level security;
alter table public.vertex_game_analytics_daily enable row level security;

create policy "published game comments are readable" on public.vertex_game_comments
for select to anon, authenticated using (
  exists (select 1 from public.vertex_games g where g.id = game_id and g.status = 'published')
  and moderation_state = 'visible'
);
create policy "users read own game comments" on public.vertex_game_comments
for select to authenticated using (user_id = (select auth.uid()));
create policy "users create comments" on public.vertex_game_comments
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.vertex_games g where g.id = game_id and g.status = 'published')
);
create policy "users update own comments" on public.vertex_game_comments
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "buyers read own purchases" on public.vertex_marketplace_purchases
for select to authenticated using (buyer_id = (select auth.uid()));

create policy "creators read analytics" on public.vertex_game_analytics_daily
for select to authenticated using (
  exists (select 1 from public.vertex_games g where g.id = game_id and g.creator_id = (select auth.uid()))
);

create policy "anon can read published games" on public.vertex_games
for select to anon using (status = 'published');
create policy "anon can read discoverable profiles" on public.vertex_profiles
for select to anon using (discoverable = true);
create policy "anon can read published marketplace items" on public.vertex_marketplace_items
for select to anon using (status = 'published');
create policy "anon can read public platform settings" on public.vertex_platform_settings
for select to anon using (true);

create policy "staff can review all games" on public.vertex_games
for select to authenticated using (private.vertex_is_staff('review_games'));
create policy "staff can moderate games" on public.vertex_games
for update to authenticated using (private.vertex_is_staff('review_games'))
with check (private.vertex_is_staff('review_games'));

create policy "staff can read all reports" on public.vertex_reports
for select to authenticated using (
  reporter_id = (select auth.uid()) or private.vertex_is_staff('view_reports')
);
create policy "staff can update reports" on public.vertex_reports
for update to authenticated using (private.vertex_is_staff('view_reports'))
with check (private.vertex_is_staff('view_reports'));

create policy "staff can read staff roles" on public.vertex_staff_roles
for select to authenticated using (
  user_id = (select auth.uid()) or private.vertex_is_staff('manage_staff')
);
create policy "owners manage staff roles" on public.vertex_staff_roles
for all to authenticated using (private.vertex_is_staff('manage_staff'))
with check (private.vertex_is_staff('manage_staff'));

create policy "staff read audit logs" on public.vertex_audit_logs
for select to authenticated using (private.vertex_is_staff('inspect_moderation_logs'));

create policy "staff read all marketplace items" on public.vertex_marketplace_items
for select to authenticated using (
  status = 'published'
  or creator_id = (select auth.uid())
  or private.vertex_is_staff('manage_marketplace')
);
create policy "staff moderate marketplace" on public.vertex_marketplace_items
for update to authenticated using (private.vertex_is_staff('manage_marketplace'))
with check (private.vertex_is_staff('manage_marketplace'));

create or replace function public.vertex_purchase_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  caller uuid := auth.uid();
  item_price bigint;
  item_status text;
  already_owned boolean;
  old_balance bigint;
begin
  if caller is null then
    raise exception 'Authentication is required.';
  end if;

  select price, status into item_price, item_status
  from public.vertex_marketplace_items
  where id = p_item_id
  for update;

  if item_status is null or item_status <> 'published' then
    raise exception 'Marketplace item is not available.';
  end if;

  select exists (
    select 1 from public.vertex_inventory i
    where i.user_id = caller and i.item_id = p_item_id
  ) into already_owned;

  if already_owned then
    return jsonb_build_object('ok', true, 'owned', true, 'price', item_price);
  end if;

  select balance into old_balance
  from public.vertex_currency_accounts
  where user_id = caller
  for update;

  if old_balance is null then
    insert into public.vertex_currency_accounts(user_id, balance) values (caller, 0);
    old_balance := 0;
  end if;

  if old_balance < item_price then
    raise exception 'Insufficient Vertex currency.';
  end if;

  update public.vertex_currency_accounts
  set balance = old_balance - item_price, updated_at = now()
  where user_id = caller;

  insert into public.vertex_currency_transactions(user_id, delta, reason, reference_type, reference_id)
  values (caller, -item_price, 'marketplace_purchase', 'marketplace_item', p_item_id);

  insert into public.vertex_marketplace_purchases(buyer_id, item_id, price)
  values (caller, p_item_id, item_price);

  insert into public.vertex_inventory(user_id, item_id)
  values (caller, p_item_id);

  return jsonb_build_object('ok', true, 'owned', true, 'price', item_price, 'balance', old_balance - item_price);
end;
$$;

revoke all on function public.vertex_purchase_item(uuid) from public;
grant execute on function public.vertex_purchase_item(uuid) to authenticated;

create or replace function public.vertex_update_own_profile(
  p_display_name text,
  p_bio text,
  p_avatar_url text
)
returns public.vertex_profiles
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  result_row public.vertex_profiles;
begin
  update public.vertex_profiles
  set display_name = left(coalesce(p_display_name, ''), 40),
      bio = left(coalesce(p_bio, ''), 280),
      avatar_url = p_avatar_url
  where user_id = auth.uid()
  returning * into result_row;

  if result_row.user_id is null then
    raise exception 'Profile does not exist.';
  end if;
  return result_row;
end;
$$;

revoke all on function public.vertex_update_own_profile(text,text,text) from public;
grant execute on function public.vertex_update_own_profile(text,text,text) to authenticated;

alter publication supabase_realtime add table public.vertex_game_comments;
