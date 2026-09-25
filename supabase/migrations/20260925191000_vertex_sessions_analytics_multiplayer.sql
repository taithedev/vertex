create table if not exists public.vertex_game_visit_keys (
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  day date not null,
  session_key text not null check (char_length(session_key) between 16 and 128),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (game_id, day, session_key)
);
create index if not exists vertex_game_visit_keys_user_day on public.vertex_game_visit_keys(user_id,day);

create table if not exists public.vertex_game_servers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  region text not null default 'ca-central-1',
  status text not null default 'online' check (status in ('starting','online','draining','offline')),
  is_private boolean not null default false,
  max_players integer not null default 16 check (max_players between 1 and 100),
  current_players integer not null default 0 check (current_players >= 0 and current_players <= max_players),
  endpoint text,
  join_code text,
  version text not null default '0.1.0',
  last_heartbeat_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vertex_game_servers_lookup on public.vertex_game_servers(game_id,status,region,last_heartbeat_at desc);

create table if not exists public.vertex_game_server_players (
  server_id uuid not null references public.vertex_game_servers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key(server_id,user_id)
);
create index if not exists vertex_game_server_players_user on public.vertex_game_server_players(user_id,last_seen_at desc);

create table if not exists public.vertex_matchmaking_queue (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  region text not null default 'nearest',
  party_size integer not null default 1 check (party_size between 1 and 16),
  status text not null default 'queued' check (status in ('queued','matched','cancelled','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists vertex_matchmaking_one_queue_per_user on public.vertex_matchmaking_queue(user_id) where status='queued';
create index if not exists vertex_matchmaking_queue_lookup on public.vertex_matchmaking_queue(game_id,region,status,created_at);

alter table public.vertex_game_visit_keys enable row level security;
alter table public.vertex_game_servers enable row level security;
alter table public.vertex_game_server_players enable row level security;
alter table public.vertex_matchmaking_queue enable row level security;

create policy "published game server list" on public.vertex_game_servers for select to anon,authenticated using (
  status='online' and exists(select 1 from public.vertex_games g where g.id=game_id and g.status='published')
);
create policy "server players see own rows" on public.vertex_game_server_players for select to authenticated using(user_id=(select auth.uid()));
create policy "queued user reads own match" on public.vertex_matchmaking_queue for select to authenticated using(user_id=(select auth.uid()));
create policy "users can queue matchmaking" on public.vertex_matchmaking_queue for insert to authenticated with check(user_id=(select auth.uid()));
create policy "users can cancel matchmaking" on public.vertex_matchmaking_queue for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create or replace function private.vertex_record_visit(p_game_id uuid,p_session_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare
  inserted_count integer;
  caller_id uuid := auth.uid();
begin
  if p_session_key is null or char_length(p_session_key)<16 or char_length(p_session_key)>128 then raise exception 'Invalid session key.'; end if;
  if not exists(select 1 from public.vertex_games where id=p_game_id and status='published') then raise exception 'Game is not published.'; end if;
  insert into public.vertex_game_visit_keys(game_id,day,session_key,user_id)
  values(p_game_id,current_date,p_session_key,caller_id)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count=1 then
    update public.vertex_games set visits_count=visits_count+1 where id=p_game_id;
    insert into public.vertex_game_analytics_daily(game_id,day,visits,unique_players,browser_sessions,desktop_sessions)
    values(p_game_id,current_date,1,case when caller_id is not null then 1 else 0 end,1,0)
    on conflict(game_id,day) do update set
      visits=public.vertex_game_analytics_daily.visits+1,
      unique_players=public.vertex_game_analytics_daily.unique_players+case when caller_id is not null then 1 else 0 end,
      browser_sessions=public.vertex_game_analytics_daily.browser_sessions+1;
  end if;
  return jsonb_build_object('counted',inserted_count=1);
end;
$$;
revoke all on function private.vertex_record_visit(uuid,text) from public;
grant execute on function private.vertex_record_visit(uuid,text) to anon,authenticated;

create or replace function public.vertex_record_game_visit(p_game_id uuid,p_session_key text)
returns jsonb language sql security invoker set search_path=public,pg_catalog as $$ select private.vertex_record_visit(p_game_id,p_session_key); $$;
revoke all on function public.vertex_record_game_visit(uuid,text) from public;
grant execute on function public.vertex_record_game_visit(uuid,text) to anon,authenticated;

create or replace function public.vertex_queue_for_game(p_game_id uuid,p_region text default 'nearest')
returns public.vertex_matchmaking_queue
language plpgsql security invoker set search_path=public,pg_catalog as $$
declare result_row public.vertex_matchmaking_queue;
begin
  if auth.uid() is null then raise exception 'Authentication is required.'; end if;
  if not exists(select 1 from public.vertex_games where id=p_game_id and status='published') then raise exception 'Game is not published.'; end if;
  insert into public.vertex_matchmaking_queue(game_id,user_id,region)
  values(p_game_id,auth.uid(),coalesce(nullif(trim(p_region),''),'nearest'))
  on conflict do nothing
  returning * into result_row;
  if result_row.id is null then select * into result_row from public.vertex_matchmaking_queue where user_id=auth.uid() and status='queued' limit 1; end if;
  return result_row;
end;
$$;
revoke all on function public.vertex_queue_for_game(uuid,text) from public;
grant execute on function public.vertex_queue_for_game(uuid,text) to authenticated;

create or replace function public.vertex_cancel_matchmaking()
returns boolean
language plpgsql security invoker set search_path=public,pg_catalog as $$
begin
  if auth.uid() is null then return false; end if;
  update public.vertex_matchmaking_queue set status='cancelled',updated_at=now() where user_id=auth.uid() and status='queued';
  return found;
end;
$$;
revoke all on function public.vertex_cancel_matchmaking() from public;
grant execute on function public.vertex_cancel_matchmaking() to authenticated;