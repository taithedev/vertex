create schema if not exists vertex_private;

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
    coalesce(nullif(left(new.raw_user_meta_data->>'display_name', 64), ''), 'Vertex Player')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function vertex_private.handle_new_user() from public, anon, authenticated;

drop trigger if exists vertex_auth_user_created on auth.users;
create trigger vertex_auth_user_created
after insert on auth.users
for each row execute function vertex_private.handle_new_user();