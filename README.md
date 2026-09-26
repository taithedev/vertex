# Vertex

Vertex is a static browser gaming platform frontend backed by the dedicated Vertex Supabase project.

## Frontend architecture

- Plain HTML
- CSS
- Browser JavaScript
- Supabase JS v2
- Vercel static hosting

There is intentionally **no Next.js, React build, npm build step, or server framework** in the web frontend.

The browser uses the Supabase publishable key only. Server-only secrets stay in Supabase/Vercel infrastructure.

## Vertex database

The connected Supabase project is the source of truth for Vertex accounts, games, social features, economy, moderation, analytics, assets, matchmaking, and server control.

The public application tables are now isolated under the `vertex_` namespace. The old Zuzify/Premium public tables and legacy premium auth trigger were removed from this project.

Current Vertex tables cover:

- Auth profiles and staff roles
- Games, versions, members, comments, likes, favorites
- Achievements and badges
- Follows, friendships, conversations, conversation members, messages
- Currency accounts and transactions
- Marketplace items and purchases
- Inventory
- Reports, moderation, and audit logs
- Game analytics and visit keys
- Game servers, server players, and matchmaking
- Platform settings and notifications

Supabase-managed `auth`, `storage`, and `realtime` system tables remain part of the hosted service and are not application tables.

## Age and safety

Vertex is a **12+ platform**. New profile dates of birth are checked server-side so a saved birth date cannot indicate an age below 12.

## Static deployment

Vercel is configured as a static site. There is no framework build command. The root `index.html` is the entrypoint and `vercel.json` rewrites browser routes to it.

This makes deployment independent of Next.js and avoids framework-specific build/runtime failures.

## Quality checks

GitHub Actions validates JavaScript syntax, required static files, the Vercel configuration, the static entrypoint, and frontend references to legacy Zuzify/Premium tables.

## Scope

The player-facing shell follows the clean, compact structure of modern Vortex-style platforms: left navigation, top search/sign-in controls, catalog-first home content, creator/download access, and simple footer/legal navigation. Vertex keeps its own name, branding, data, and functionality rather than copying Vortex assets.

Studio scene editing, script editing, and the larger new-game creation expansion remain paused as previously requested.

The dedicated Vertex server-control and matchmaking backend is preserved; the browser runtime is not presented as a Roblox-scale authoritative multiplayer simulation.

## Accounts, profiles, avatars, currency, owner controls, and support

- Dedicated static `signin.html` and `signup.html` pages
- Google OAuth uses Supabase Auth and the Supabase Site URL as the post-login destination
- Email signup passes username, display name, and date of birth to the server-side profile trigger
- Vertex profiles support profile pictures, bio, website/YouTube/TikTok/Instagram/X/Discord links
- The Avatar page saves a customizable block-style player look in `vertex_avatar_looks`
- The first auth account on an otherwise ownerless project is bootstrapped as the Vertex owner
- Owner Console supports protected user search, moderation state changes, currency adjustments, staff roles, and audit logging
- Owner actions are performed through server-side database functions rather than trusting browser-only owner checks


- Email/password accounts with 12+ signup validation
- Google OAuth sign-in button using Supabase Auth
- Vertex Coins account balance shown in the signed-in shell
- 100-coin welcome grant for new auth users
- 25-coin daily reward with a server-side 24-hour check
- Marketplace spending remains server-controlled through Vertex currency functions
- Settings includes the Vertex Support chat
- Vertex Support uses a Supabase Edge Function with Groq and the current `openai/gpt-oss-120b` model by default
- Groq credentials are server-side only; never put a Groq API key in browser JavaScript

### External provider setup

Google OAuth requires the Google provider to be enabled in the Supabase Auth dashboard and its OAuth client/redirect configuration to be registered. Supabase documents the web flow and provider setup here:
https://supabase.com/docs/guides/auth/social-login/auth-google

Vertex Support requires the Supabase Edge Function secret `GROQ_API_KEY`. An optional `VERTEX_SUPPORT_MODEL` secret can override the default model.
