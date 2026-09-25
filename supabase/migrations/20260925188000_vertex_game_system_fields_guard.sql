create or replace function private.vertex_guard_game_system_fields()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if not private.vertex_is_staff(null) then
    if new.likes_count is distinct from old.likes_count
       or new.favorites_count is distinct from old.favorites_count
       or new.visits_count is distinct from old.visits_count
       or new.published_at is distinct from old.published_at then
      raise exception 'System-managed game metrics cannot be changed directly.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.vertex_guard_game_system_fields() from public;

drop trigger if exists vertex_guard_game_system_fields on public.vertex_games;
create trigger vertex_guard_game_system_fields
before update on public.vertex_games
for each row execute function private.vertex_guard_game_system_fields();