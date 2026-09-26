create table if not exists public.vertex_support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now()
);

alter table public.vertex_support_messages enable row level security;

drop policy if exists "vertex users read own support messages" on public.vertex_support_messages;
create policy "vertex users read own support messages"
on public.vertex_support_messages
for select to authenticated
using ((select auth.uid()) = user_id);

create index if not exists vertex_support_messages_user_created_idx
on public.vertex_support_messages (user_id, created_at desc);

create or replace function vertex_private.ensure_currency_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.vertex_currency_accounts(user_id,balance)
  values (p_user_id,100)
  on conflict (user_id) do nothing;

  if found then
    insert into public.vertex_currency_transactions(
      user_id, delta, reason, reference_type
    ) values (
      p_user_id, 100, 'welcome_bonus', 'account'
    );
  end if;
end;
$$;

revoke all on function vertex_private.ensure_currency_account(uuid) from public, anon, authenticated;

create or replace function vertex_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.vertex_profiles (user_id, username, display_name)
  values (
    new.id,
    coalesce(nullif(left(new.raw_user_meta_data->>'username', 32), ''), 'player_' || substr(new.id::text, 1, 8)),
    coalesce(
      nullif(left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'display_name'), 64), ''),
      'Vertex Player'
    )
  )
  on conflict (user_id) do nothing;

  perform vertex_private.ensure_currency_account(new.id);
  return new;
end;
$$;

revoke all on function vertex_private.handle_new_user() from public, anon, authenticated;

drop function if exists vertex_private.claim_daily_reward();
create or replace function vertex_private.claim_daily_reward()
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := auth.uid();
  current_balance bigint;
  last_claim timestamptz;
begin
  if caller is null then
    raise exception 'Authentication required.';
  end if;

  select balance into current_balance
  from public.vertex_currency_accounts
  where user_id = caller
  for update;

  if current_balance is null then
    insert into public.vertex_currency_accounts(user_id,balance)
    values (caller,0)
    on conflict (user_id) do nothing;
    select balance into current_balance
    from public.vertex_currency_accounts
    where user_id = caller
    for update;
  end if;

  select max(created_at) into last_claim
  from public.vertex_currency_transactions
  where user_id = caller
    and reason = 'daily_reward';

  if last_claim is not null and last_claim > now() - interval '24 hours' then
    raise exception 'Daily reward is already claimed. Try again after 24 hours.';
  end if;

  current_balance := current_balance + 25;

  update public.vertex_currency_accounts
  set balance = current_balance, updated_at = now()
  where user_id = caller;

  insert into public.vertex_currency_transactions(
    user_id, delta, reason, reference_type
  ) values (
    caller, 25, 'daily_reward', 'reward'
  );

  return current_balance;
end;
$$;

revoke all on function vertex_private.claim_daily_reward() from public, anon, authenticated;

create or replace function public.vertex_claim_daily_reward()
returns bigint
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  return vertex_private.claim_daily_reward();
end;
$$;

revoke all on function public.vertex_claim_daily_reward() from public, anon;
grant execute on function public.vertex_claim_daily_reward() to authenticated;