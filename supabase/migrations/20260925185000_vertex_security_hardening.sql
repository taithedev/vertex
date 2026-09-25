create or replace function private.vertex_guard_game_status()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare is_reviewer boolean;
begin
  if new.status = old.status then return new; end if;
  is_reviewer := private.vertex_is_staff('review_games');
  if is_reviewer then return new; end if;
  if auth.uid() is null or auth.uid() <> new.creator_id then raise exception 'You are not allowed to change this game status.'; end if;
  if (old.status = 'draft' and new.status = 'pending_review') or (old.status = 'pending_review' and new.status = 'draft') then return new; end if;
  raise exception 'Only authorized Vertex reviewers can approve, pause, decline, or remove games.';
end;
$$;

revoke all on all tables in schema public from authenticated;

grant select, insert, update on public.vertex_profiles to authenticated;
grant select, insert, update on public.vertex_games to authenticated;
grant select, insert on public.vertex_game_versions to authenticated;
grant select, insert, update on public.vertex_game_members to authenticated;
grant select, insert, delete on public.vertex_game_likes to authenticated;
grant select, insert, delete on public.vertex_game_favorites to authenticated;
grant select, insert, delete on public.vertex_follows to authenticated;
grant select, insert, update on public.vertex_friendships to authenticated;
grant select, insert on public.vertex_conversations to authenticated;
grant select, insert, update on public.vertex_conversation_members to authenticated;
grant select, insert, update on public.vertex_messages to authenticated;
grant select, update on public.vertex_notifications to authenticated;
grant select on public.vertex_currency_accounts to authenticated;
grant select on public.vertex_currency_transactions to authenticated;
grant select, insert, update on public.vertex_marketplace_items to authenticated;
grant select on public.vertex_inventory to authenticated;
grant select on public.vertex_badges to authenticated;
grant select on public.vertex_user_badges to authenticated;
grant select on public.vertex_achievements to authenticated;
grant select on public.vertex_user_achievements to authenticated;
grant select, insert, update on public.vertex_game_comments to authenticated;
grant select on public.vertex_marketplace_purchases to authenticated;
grant select on public.vertex_game_analytics_daily to authenticated;
grant select, insert, update on public.vertex_reports to authenticated;
grant select, insert, update, delete on public.vertex_staff_roles to authenticated;
grant select, insert on public.vertex_audit_logs to authenticated;
grant select on public.vertex_platform_settings to authenticated;