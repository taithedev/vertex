revoke execute on function public.vertex_purchase_item(uuid) from anon;
revoke execute on function public.vertex_update_own_profile(text,text,text) from anon;

drop policy if exists "members can add themselves" on public.vertex_conversation_members;
drop policy if exists "conversation creators can add members" on public.vertex_conversation_members;
create policy "conversation creators manage members" on public.vertex_conversation_members
for insert to authenticated with check (
  exists (
    select 1 from public.vertex_conversations c
    where c.id = conversation_id and c.created_by = (select auth.uid())
  )
);

drop policy if exists "owners add memberships" on public.vertex_game_members;
create policy "game owners manage memberships" on public.vertex_game_members
for insert to authenticated with check (
  exists (
    select 1 from public.vertex_games g
    where g.id = game_id and g.creator_id = (select auth.uid())
  )
);

drop policy if exists "members read membership" on public.vertex_game_members;
create policy "members read membership" on public.vertex_game_members
for select to authenticated using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.vertex_games g
    where g.id = game_id and g.creator_id = (select auth.uid())
  )
);