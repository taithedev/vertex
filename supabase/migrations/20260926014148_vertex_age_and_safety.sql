alter table public.vertex_profiles
  add column if not exists birth_date date;

alter table public.vertex_profiles
  add column if not exists safety_acknowledged_at timestamptz;

create index if not exists vertex_profiles_birth_date_idx
  on public.vertex_profiles (birth_date);