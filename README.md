# Vertex

Vertex is a static browser gaming platform frontend backed by the existing Vertex Supabase backend.

## Frontend architecture

- Plain HTML
- CSS
- Browser JavaScript
- Supabase JS v2
- Vercel static hosting

There is intentionally **no Next.js, React build, npm build step, or server framework** in the web frontend.

The browser uses the Supabase publishable key only. Server-only secrets stay in Supabase/Vercel infrastructure.

## Existing backend

The connected Supabase project remains the source of truth for:

- Auth and profiles
- Published games and game metadata
- Likes and favorites
- Analytics and visit tracking
- Marketplace data
- Messages and social data
- Moderation and staff roles
- Asset storage
- Matchmaking and server control
- Realtime platform presence

The existing Vertex database uses the `vertex_` namespace for its platform tables and keeps RLS enabled.

## Static deployment

Vercel is configured as a static site. There is no framework build command. The root `index.html` is the entrypoint and `vercel.json` rewrites browser routes to it.

This makes deployment independent of Next.js and avoids framework-specific build/runtime failures.

## Quality checks

GitHub Actions validates JavaScript syntax, required static files, the Vercel configuration, and the static entrypoint.

## Scope

The rebuild improves the core player-facing shell, authentication flow, game discovery, game pages, browser runtime, profile settings, creator dashboard, analytics navigation, marketplace/messages/asset areas, and mobile layout.

As requested, Studio scene editing, script editing, and the larger new-game creation expansion remain paused.

The existing dedicated server-control and matchmaking backend is preserved; the browser runtime is not presented as a Roblox-scale authoritative multiplayer simulation.