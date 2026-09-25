revoke all on function private.vertex_update_game_counters() from public;
revoke all on function private.vertex_is_staff(text) from public;
grant execute on function private.vertex_is_staff(text) to authenticated;
grant usage on schema private to authenticated;