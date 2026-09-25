create or replace function private.vertex_update_game_counters()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    if tg_table_name = 'vertex_game_likes' then
      update public.vertex_games set likes_count = likes_count + 1 where id = new.game_id;
    else
      update public.vertex_games set favorites_count = favorites_count + 1 where id = new.game_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if tg_table_name = 'vertex_game_likes' then
      update public.vertex_games set likes_count = greatest(0, likes_count - 1) where id = old.game_id;
    else
      update public.vertex_games set favorites_count = greatest(0, favorites_count - 1) where id = old.game_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists vertex_game_likes_counter on public.vertex_game_likes;
create trigger vertex_game_likes_counter
after insert or delete on public.vertex_game_likes
for each row execute function private.vertex_update_game_counters();

drop trigger if exists vertex_game_favorites_counter on public.vertex_game_favorites;
create trigger vertex_game_favorites_counter
after insert or delete on public.vertex_game_favorites
for each row execute function private.vertex_update_game_counters();

grant execute on function private.vertex_update_game_counters() to authenticated;