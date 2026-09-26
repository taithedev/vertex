create or replace function vertex_private.enforce_vertex_age()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.birth_date is not null
     and new.birth_date > (current_date - interval '12 years')::date then
    raise exception 'Vertex requires users to be at least 12 years old';
  end if;
  return new;
end;
$$;

drop trigger if exists vertex_profile_age_guard on public.vertex_profiles;
create trigger vertex_profile_age_guard
before insert or update of birth_date on public.vertex_profiles
for each row execute function vertex_private.enforce_vertex_age();