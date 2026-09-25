create or replace function private.vertex_find_game_session(p_game_id uuid,p_region text default 'nearest')
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  caller_id uuid:=auth.uid();
  target_server public.vertex_game_servers;
  inserted_player boolean:=false;
  queued_row public.vertex_matchmaking_queue;
begin
  if caller_id is null then raise exception 'Authentication is required.'; end if;
  if not exists(select 1 from public.vertex_games where id=p_game_id and status='published') then raise exception 'Game is not published.'; end if;

  select * into target_server
  from public.vertex_game_servers
  where game_id=p_game_id
    and status='online'
    and current_players < max_players
    and (p_region is null or p_region='nearest' or region=p_region)
    and (expires_at is null or expires_at>now())
  order by current_players asc,last_heartbeat_at desc
  limit 1
  for update skip locked;

  if target_server.id is not null then
    insert into public.vertex_game_server_players(server_id,user_id)
    values(target_server.id,caller_id)
    on conflict do nothing;
    inserted_player:=found;
    if inserted_player then
      update public.vertex_game_servers
      set current_players=current_players+1,last_heartbeat_at=now()
      where id=target_server.id;
      update public.vertex_matchmaking_queue
      set status='matched',updated_at=now()
      where game_id=p_game_id and user_id=caller_id and status='queued';
    end if;
    return jsonb_build_object('matched',true,'server_id',target_server.id,'region',target_server.region,'current_players',target_server.current_players + case when inserted_player then 1 else 0 end);
  end if;

  insert into public.vertex_matchmaking_queue(game_id,user_id,region)
  values(p_game_id,caller_id,coalesce(nullif(trim(p_region),''),'nearest'))
  on conflict do nothing
  returning * into queued_row;

  return jsonb_build_object('matched',false,'queued',true,'queue_id',queued_row.id);
end;
$$;
revoke all on function private.vertex_find_game_session(uuid,text) from public;
grant execute on function private.vertex_find_game_session(uuid,text) to authenticated;

create or replace function public.vertex_find_game_session(p_game_id uuid,p_region text default 'nearest')
returns jsonb
language sql
security invoker
set search_path=public,pg_catalog
as $$ select private.vertex_find_game_session(p_game_id,p_region); $$;
revoke all on function public.vertex_find_game_session(uuid,text) from public;
grant execute on function public.vertex_find_game_session(uuid,text) to authenticated;