drop trigger if exists on_auth_user_created_premium on auth.users;

drop table if exists public.ai_conversations cascade;
drop table if exists public.ai_messages cascade;
drop table if exists public.ai_request_windows cascade;
drop table if exists public.chat_conversations cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_participants cascade;
drop table if exists public.premium_admins cascade;
drop table if exists public.premium_credit_transactions cascade;
drop table if exists public.premium_credits cascade;
drop table if exists public.premium_settings cascade;
drop table if exists public.premium_subscriptions cascade;
drop table if exists public.user_profiles cascade;

drop function if exists public.consume_ai_request(uuid);
drop function if exists public.handle_premium_user_created();
drop function if exists public.set_chat_ai_updated_at();
drop function if exists public.set_premium_credits_updated_at();
drop function if exists public.set_premium_updated_at();