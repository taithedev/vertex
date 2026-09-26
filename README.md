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
