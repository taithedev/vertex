-- Vertex AI + production owner controls
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('user','assistant','system')),
  content text not null check(char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);
create table if not exists public.ai_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_request_at timestamptz not null default 'epoch',
  requests_today integer not null default 0,
  day date not null default current_date
);
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_rate_limits enable row level security;
drop policy if exists "ai conversations own" on public.ai_conversations;
create policy "ai conversations own" on public.ai_conversations for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists "ai messages own" on public.ai_messages;
create policy "ai messages own" on public.ai_messages for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists "ai rate limits own" on public.ai_rate_limits;
create policy "ai rate limits own" on public.ai_rate_limits for select to authenticated using((select auth.uid())=user_id);
create index if not exists ai_conversations_user_updated_idx on public.ai_conversations(user_id,updated_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id,created_at);
create or replace function public.consume_ai_request(p_user_id uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare now_ts timestamptz:=now(); current_day date:=current_date; last_ts timestamptz; used_today integer;
begin
 if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then return false; end if;
 insert into public.ai_rate_limits(user_id,last_request_at,requests_today,day) values(p_user_id,'epoch',0,current_day) on conflict(user_id) do nothing;
 select last_request_at,requests_today into last_ts,used_today from public.ai_rate_limits where user_id=p_user_id for update;
 if last_ts>now_ts-interval '3 seconds' or used_today>=300 then return false; end if;
 update public.ai_rate_limits set last_request_at=now_ts,requests_today=case when day=current_day then requests_today+1 else 1 end,day=current_day where user_id=p_user_id;
 return true;
end $$;
revoke all on function public.consume_ai_request(uuid) from public,anon,authenticated;
grant execute on function public.consume_ai_request(uuid) to service_role;
grant select,insert,update,delete on public.ai_conversations to authenticated;
grant select,insert,update,delete on public.ai_messages to authenticated;
grant select on public.ai_rate_limits to authenticated;

create or replace function public.vertex_owner_dashboard_stats() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if actor is null or not exists(select 1 from public.vertex_staff_roles where user_id=actor and role='owner') then raise exception 'Owner access required'; end if;
 select jsonb_build_object('users',(select count(*) from auth.users),'profiles',(select count(*) from public.vertex_profiles),'published_games',(select count(*) from public.vertex_games where status='published'),'pending_games',(select count(*) from public.vertex_games where status='pending_review'),'open_reports',(select count(*) from public.vertex_reports where status in('open','reviewing')),'staff',(select count(*) from public.vertex_staff_roles where role<>'owner'),'coins',(select coalesce(sum(balance),0) from public.vertex_currency_accounts),'maintenance',(select maintenance_mode from public.vertex_platform_settings where id=true)) into result;
 return result;
end $$;

create or replace function public.vertex_owner_list_games(p_status text default 'all',p_limit integer default 100)
returns table(id uuid,creator_id uuid,title text,slug text,status text,genre text,age_rating text,visits_count bigint,likes_count integer,favorites_count integer,created_at timestamptz,updated_at timestamptz)
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.vertex_staff_roles where user_id=actor and role='owner') then raise exception 'Owner access required'; end if;
 return query select g.id,g.creator_id,g.title,g.slug,g.status,g.genre,g.age_rating,g.visits_count,g.likes_count,g.favorites_count,g.created_at,g.updated_at from public.vertex_games g where p_status is null or p_status='all' or g.status=p_status order by g.updated_at desc limit greatest(1,least(coalesce(p_limit,100),200));
end $$;

create or replace function public.vertex_owner_set_game_status(p_game_id uuid,p_status text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.vertex_staff_roles where user_id=actor and role='owner') then raise exception 'Owner access required'; end if;
 if p_status not in('draft','pending_review','published','paused','declined','removed') then raise exception 'Invalid game status'; end if;
 update public.vertex_games set status=p_status,published_at=case when p_status='published' then coalesce(published_at,now()) else published_at end,updated_at=now() where id=p_game_id;
 if not found then return false; end if;
 insert into public.vertex_audit_logs(actor_id,action,target_type,target_id,metadata) values(actor,'owner.game_status','game',p_game_id,jsonb_build_object('status',p_status));
 return true;
end $$;

create or replace function public.vertex_owner_set_platform_settings(p_site_name text,p_announcement text,p_maintenance boolean,p_theme text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.vertex_staff_roles where user_id=actor and role='owner') then raise exception 'Owner access required'; end if;
 update public.vertex_platform_settings set site_name=left(coalesce(p_site_name,'Vertex'),80),announcement=nullif(left(coalesce(p_announcement,''),1000),''),maintenance_mode=coalesce(p_maintenance,false),theme=left(coalesce(p_theme,'vertex-dark'),80),updated_at=now() where id=true;
 insert into public.vertex_audit_logs(actor_id,action,target_type,metadata) values(actor,'owner.platform_settings','platform',jsonb_build_object('maintenance',p_maintenance));
 return true;
end $$;

create or replace function public.vertex_owner_list_reports(p_status text default 'open',p_limit integer default 100)
returns table(id uuid,reporter_id uuid,target_type text,target_id uuid,reason text,severity text,status text,assigned_to uuid,created_at timestamptz)
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.vertex_staff_roles where user_id=actor and role in('owner','manager','admin','senior_moderator','moderator','support')) then raise exception 'Staff access required'; end if;
 return query select r.id,r.reporter_id,r.target_type,r.target_id,r.reason,r.severity,r.status,r.assigned_to,r.created_at from public.vertex_reports r where p_status is null or p_status='all' or r.status=p_status order by r.created_at desc limit greatest(1,least(coalesce(p_limit,100),200));
end $$;

create or replace function public.vertex_owner_resolve_report(p_report_id uuid,p_status text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.vertex_staff_roles where user_id=actor and role in('owner','manager','admin','senior_moderator','moderator','support')) then raise exception 'Staff access required'; end if;
 if p_status not in('open','reviewing','resolved','dismissed') then raise exception 'Invalid report status'; end if;
 update public.vertex_reports set status=p_status,assigned_to=coalesce(assigned_to,actor),resolved_at=case when p_status in('resolved','dismissed') then now() else null end where id=p_report_id;
 if not found then return false; end if;
 insert into public.vertex_audit_logs(actor_id,action,target_type,target_id,metadata) values(actor,'moderation.report_status','report',p_report_id,jsonb_build_object('status',p_status));
 return true;
end $$;

revoke all on function public.vertex_owner_dashboard_stats() from public,anon;
grant execute on function public.vertex_owner_dashboard_stats() to authenticated;
revoke all on function public.vertex_owner_list_games(text,integer) from public,anon;
grant execute on function public.vertex_owner_list_games(text,integer) to authenticated;
revoke all on function public.vertex_owner_set_game_status(uuid,text) from public,anon;
grant execute on function public.vertex_owner_set_game_status(uuid,text) to authenticated;
revoke all on function public.vertex_owner_set_platform_settings(text,text,boolean,text) from public,anon;
grant execute on function public.vertex_owner_set_platform_settings(text,text,boolean,text) to authenticated;
revoke all on function public.vertex_owner_list_reports(text,integer) from public,anon;
grant execute on function public.vertex_owner_list_reports(text,integer) to authenticated;
revoke all on function public.vertex_owner_resolve_report(uuid,text) from public,anon;
grant execute on function public.vertex_owner_resolve_report(uuid,text) to authenticated;