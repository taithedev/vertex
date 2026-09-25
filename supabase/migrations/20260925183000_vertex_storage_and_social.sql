create policy "conversation members can read conversations" on public.vertex_conversations
for select to authenticated using (
  exists (
    select 1 from public.vertex_conversation_members m
    where m.conversation_id = id and m.user_id = (select auth.uid())
  )
);

create policy "conversation members can read membership" on public.vertex_conversation_members
for select to authenticated using (
  exists (
    select 1 from public.vertex_conversation_members mine
    where mine.conversation_id = conversation_id and mine.user_id = (select auth.uid())
  )
);

create policy "conversation creators can add members" on public.vertex_conversation_members
for insert to authenticated with check (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.vertex_conversations c
    where c.id = conversation_id and c.created_by = (select auth.uid())
  )
);

create policy "staff can write audit logs" on public.vertex_audit_logs
for insert to authenticated with check (
  actor_id = (select auth.uid()) and private.vertex_is_staff(null)
);

insert into storage.buckets (id, name, public) values
  ('avatars','avatars',true),
  ('game-icons','game-icons',true),
  ('game-thumbnails','game-thumbnails',true),
  ('screenshots','screenshots',true),
  ('game-assets','game-assets',false),
  ('marketplace','marketplace',true),
  ('message-media','message-media',false)
on conflict (id) do nothing;

create policy "vertex public asset downloads" on storage.objects
for select to public using (
  bucket_id in ('avatars','game-icons','game-thumbnails','screenshots','marketplace')
);

create policy "vertex user uploads" on storage.objects
for insert to authenticated with check (
  bucket_id in ('avatars','game-icons','game-thumbnails','screenshots','game-assets','marketplace','message-media')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "vertex user asset updates" on storage.objects
for update to authenticated
using (owner_id = (select auth.uid()::text))
with check (owner_id = (select auth.uid()::text));

create policy "vertex user asset deletes" on storage.objects
for delete to authenticated
using (owner_id = (select auth.uid()::text));

