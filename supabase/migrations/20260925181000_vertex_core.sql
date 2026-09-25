create extension if not exists pgcrypto;

create table if not exists public.vertex_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null default 'Vertex Player' check (char_length(display_name) between 1 and 40),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 280),
  status text not null default 'online' check (status in ('online','away','offline')),
  discoverable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vertex_games (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 5000),
  genre text not null default 'Other',
  status text not null default 'draft' check (status in ('draft','pending_review','published','paused','declined','removed')),
  age_rating text not null default 'Everyone' check (age_rating in ('Everyone','10+','13+','16+')),
  thumbnail_url text,
  icon_url text,
  screenshots jsonb not null default '[]'::jsonb,
  runtime_config jsonb not null default '{"world":"starter","spawn":[0,1,6]}'::jsonb,
  current_version text not null default '0.1.0',
  likes_count integer not null default 0 check (likes_count >= 0),
  favorites_count integer not null default 0 check (favorites_count >= 0),
  visits_count bigint not null default 0 check (visits_count >= 0),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_game_versions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  version text not null check (char_length(version) between 1 and 30),
  changelog text not null default '' check (char_length(changelog) <= 5000),
  runtime_config jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  publish_state text not null default 'draft' check (publish_state in ('draft','published','rolled_back')),
  created_at timestamptz not null default now(),
  unique (game_id, version)
);

create table if not exists public.vertex_game_members (
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create table if not exists public.vertex_game_likes (
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create table if not exists public.vertex_game_favorites (
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create table if not exists public.vertex_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.vertex_friendships (
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table if not exists public.vertex_conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text check (title is null or char_length(title) <= 120),
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_conversation_members (
  conversation_id uuid not null references public.vertex_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.vertex_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.vertex_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000 and length(btrim(content)) > 0),
  attachment_url text,
  deleted_at timestamptz,
  moderation_state text not null default 'visible' check (moderation_state in ('visible','flagged','removed')),
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 1000),
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_currency_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.vertex_currency_transactions (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta bigint not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_marketplace_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null default 'Cosmetic',
  price bigint not null default 0 check (price >= 0),
  image_url text,
  status text not null default 'draft' check (status in ('draft','published','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vertex_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.vertex_marketplace_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.vertex_badges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.vertex_games(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  image_url text,
  requirement jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.vertex_badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.vertex_achievements (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.vertex_games(id) on delete cascade,
  name text not null,
  description text not null default '',
  requirement jsonb not null default '{}'::jsonb
);

create table if not exists public.vertex_user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.vertex_achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.vertex_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('user','game','message','content')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  evidence jsonb not null default '{}'::jsonb,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','assigned','resolved','dismissed')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.vertex_staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','admin','developer','senior_moderator','moderator','support')),
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vertex_audit_logs (
  id bigint generated by default as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vertex_platform_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'Vertex',
  announcement text,
  maintenance_mode boolean not null default false,
  theme text not null default 'vertex-dark',
  updated_at timestamptz not null default now()
);

insert into public.vertex_platform_settings(id) values (true) on conflict (id) do nothing;

create index if not exists vertex_games_status_updated on public.vertex_games(status, updated_at desc);
create index if not exists vertex_games_creator on public.vertex_games(creator_id);
create index if not exists vertex_game_versions_game on public.vertex_game_versions(game_id, created_at desc);
create index if not exists vertex_messages_conversation on public.vertex_messages(conversation_id, created_at desc);
create index if not exists vertex_notifications_user on public.vertex_notifications(user_id, created_at desc);
create index if not exists vertex_reports_queue on public.vertex_reports(status, severity, created_at);
create index if not exists vertex_marketplace_status on public.vertex_marketplace_items(status, category, created_at desc);
create index if not exists vertex_audit_created on public.vertex_audit_logs(created_at desc);

create or replace function public.vertex_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vertex_profiles_touch on public.vertex_profiles;
create trigger vertex_profiles_touch before update on public.vertex_profiles for each row execute function public.vertex_touch_updated_at();

drop trigger if exists vertex_games_touch on public.vertex_games;
create trigger vertex_games_touch before update on public.vertex_games for each row execute function public.vertex_touch_updated_at();

drop trigger if exists vertex_friendships_touch on public.vertex_friendships;
create trigger vertex_friendships_touch before update on public.vertex_friendships for each row execute function public.vertex_touch_updated_at();

drop trigger if exists vertex_staff_roles_touch on public.vertex_staff_roles;
create trigger vertex_staff_roles_touch before update on public.vertex_staff_roles for each row execute function public.vertex_touch_updated_at();

drop trigger if exists vertex_currency_touch on public.vertex_currency_accounts;
create trigger vertex_currency_touch before update on public.vertex_currency_accounts for each row execute function public.vertex_touch_updated_at();

drop trigger if exists vertex_marketplace_touch on public.vertex_marketplace_items;
create trigger vertex_marketplace_touch before update on public.vertex_marketplace_items for each row execute function public.vertex_touch_updated_at();

drop trigger if exists vertex_platform_touch on public.vertex_platform_settings;
create trigger vertex_platform_touch before update on public.vertex_platform_settings for each row execute function public.vertex_touch_updated_at();

alter table public.vertex_profiles enable row level security;
alter table public.vertex_games enable row level security;
alter table public.vertex_game_versions enable row level security;
alter table public.vertex_game_members enable row level security;
alter table public.vertex_game_likes enable row level security;
alter table public.vertex_game_favorites enable row level security;
alter table public.vertex_follows enable row level security;
alter table public.vertex_friendships enable row level security;
alter table public.vertex_conversations enable row level security;
alter table public.vertex_conversation_members enable row level security;
alter table public.vertex_messages enable row level security;
alter table public.vertex_notifications enable row level security;
alter table public.vertex_currency_accounts enable row level security;
alter table public.vertex_currency_transactions enable row level security;
alter table public.vertex_marketplace_items enable row level security;
alter table public.vertex_inventory enable row level security;
alter table public.vertex_badges enable row level security;
alter table public.vertex_user_badges enable row level security;
alter table public.vertex_achievements enable row level security;
alter table public.vertex_user_achievements enable row level security;
alter table public.vertex_reports enable row level security;
alter table public.vertex_staff_roles enable row level security;
alter table public.vertex_audit_logs enable row level security;
alter table public.vertex_platform_settings enable row level security;

create policy "profiles are readable when discoverable or self" on public.vertex_profiles
for select to authenticated using (discoverable or user_id = (select auth.uid()));
create policy "users create their own profile" on public.vertex_profiles
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users update their own profile" on public.vertex_profiles
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "published games are public to authenticated users" on public.vertex_games
for select to authenticated using (status = 'published' or creator_id = (select auth.uid()));
create policy "users create games" on public.vertex_games
for insert to authenticated with check (creator_id = (select auth.uid()));
create policy "owners and editors can update games" on public.vertex_games
for update to authenticated using (
  creator_id = (select auth.uid()) or exists (
    select 1 from public.vertex_game_members m
    where m.game_id = id and m.user_id = (select auth.uid()) and m.role in ('owner','editor')
  )
) with check (
  creator_id = (select auth.uid()) or exists (
    select 1 from public.vertex_game_members m
    where m.game_id = id and m.user_id = (select auth.uid()) and m.role in ('owner','editor')
  )
);

create policy "game versions visible to members" on public.vertex_game_versions
for select to authenticated using (
  exists (select 1 from public.vertex_games g where g.id = game_id and (g.status = 'published' or g.creator_id = (select auth.uid())))
);
create policy "owners can create versions" on public.vertex_game_versions
for insert to authenticated with check (
  created_by = (select auth.uid()) and exists (
    select 1 from public.vertex_games g where g.id = game_id and g.creator_id = (select auth.uid())
  )
);

create policy "members read membership" on public.vertex_game_members
for select to authenticated using (user_id = (select auth.uid()) or exists (
  select 1 from public.vertex_games g where g.id = game_id and g.creator_id = (select auth.uid())
));
create policy "owners add memberships" on public.vertex_game_members
for insert to authenticated with check (exists (
  select 1 from public.vertex_games g where g.id = game_id and g.creator_id = (select auth.uid())
) or user_id = (select auth.uid()));
create policy "owners update memberships" on public.vertex_game_members
for update to authenticated using (exists (
  select 1 from public.vertex_games g where g.id = game_id and g.creator_id = (select auth.uid())
)) with check (exists (
  select 1 from public.vertex_games g where g.id = game_id and g.creator_id = (select auth.uid())
));

create policy "users manage own likes" on public.vertex_game_likes
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users manage own favorites" on public.vertex_game_favorites
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "follow rows readable" on public.vertex_follows
for select to authenticated using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));
create policy "users manage own follows" on public.vertex_follows
for insert to authenticated with check (follower_id = (select auth.uid()));
create policy "users remove own follows" on public.vertex_follows
for delete to authenticated using (follower_id = (select auth.uid()));

create policy "friend rows visible to participants" on public.vertex_friendships
for select to authenticated using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));
create policy "send friend requests" on public.vertex_friendships
for insert to authenticated with check (requester_id = (select auth.uid()));
create policy "update received friend requests" on public.vertex_friendships
for update to authenticated using (addressee_id = (select auth.uid()) or requester_id = (select auth.uid()))
with check (addressee_id = (select auth.uid()) or requester_id = (select auth.uid()));

create policy "conversation members see membership" on public.vertex_conversation_members
for select to authenticated using (user_id = (select auth.uid()));
create policy "users create conversations" on public.vertex_conversations
for insert to authenticated with check (created_by = (select auth.uid()));
create policy "members can add themselves" on public.vertex_conversation_members
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "members read messages" on public.vertex_messages
for select to authenticated using (exists (
  select 1 from public.vertex_conversation_members m where m.conversation_id = conversation_id and m.user_id = (select auth.uid())
));
create policy "members send messages" on public.vertex_messages
for insert to authenticated with check (sender_id = (select auth.uid()) and exists (
  select 1 from public.vertex_conversation_members m where m.conversation_id = conversation_id and m.user_id = (select auth.uid())
));
create policy "users delete own messages" on public.vertex_messages
for update to authenticated using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

create policy "users read own notifications" on public.vertex_notifications
for select to authenticated using (user_id = (select auth.uid()));
create policy "users update own notifications" on public.vertex_notifications
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "users read own currency" on public.vertex_currency_accounts
for select to authenticated using (user_id = (select auth.uid()));
create policy "users read own transactions" on public.vertex_currency_transactions
for select to authenticated using (user_id = (select auth.uid()));

create policy "published marketplace items are readable" on public.vertex_marketplace_items
for select to authenticated using (status = 'published' or creator_id = (select auth.uid()));
create policy "creators create marketplace items" on public.vertex_marketplace_items
for insert to authenticated with check (creator_id = (select auth.uid()));
create policy "creators update marketplace items" on public.vertex_marketplace_items
for update to authenticated using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));

create policy "users read own inventory" on public.vertex_inventory
for select to authenticated using (user_id = (select auth.uid()));

create policy "badges readable" on public.vertex_badges
for select to authenticated using (game_id is null or exists (
  select 1 from public.vertex_games g where g.id = game_id and (g.status = 'published' or g.creator_id = (select auth.uid()))
));
create policy "users read earned badges" on public.vertex_user_badges
for select to authenticated using (user_id = (select auth.uid()));
create policy "achievements readable" on public.vertex_achievements
for select to authenticated using (exists (
  select 1 from public.vertex_games g where g.id = game_id and (g.status = 'published' or g.creator_id = (select auth.uid()))
));
create policy "users read own achievements" on public.vertex_user_achievements
for select to authenticated using (user_id = (select auth.uid()));

create policy "users create reports" on public.vertex_reports
for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "users read own reports" on public.vertex_reports
for select to authenticated using (reporter_id = (select auth.uid()));

create policy "staff roles are private" on public.vertex_staff_roles
for select to authenticated using (user_id = (select auth.uid()));
create policy "audit logs are private" on public.vertex_audit_logs
for select to authenticated using (actor_id = (select auth.uid()));
create policy "platform settings are public" on public.vertex_platform_settings
for select to authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select on public.vertex_games, public.vertex_profiles, public.vertex_marketplace_items, public.vertex_badges, public.vertex_achievements, public.vertex_platform_settings to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter publication supabase_realtime add table public.vertex_messages;
alter publication supabase_realtime add table public.vertex_notifications;
alter publication supabase_realtime add table public.vertex_friendships;
