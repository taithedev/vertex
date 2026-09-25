# Vertex architecture

Vertex is a new platform with its own database namespace, UI system, authentication flow, game metadata, moderation model, and browser runtime.

## Web

Next.js App Router provides the public platform, authenticated screens, developer studio, and protected owner tooling. Supabase SSR clients use cookie-backed sessions and the root proxy refreshes claims.

## Backend

Supabase PostgreSQL stores platform state. Realtime is reserved for platform/social events such as messages, notifications, friendships, and comments. High-frequency game simulation is deliberately not implemented through database polling.

## Browser runtime

The web player uses Three.js WebGL to render a real procedural starter scene. The runtime boundary is separate from platform authorization and does not execute arbitrary server-side code.

## Game publishing

Creators own projects. Drafts can be moved into review. Staff/owner roles are enforced in PostgreSQL and publication-state changes are guarded by a database trigger. Published games become discoverable and launchable.

## Desktop

The Tauri app is a launcher foundation. It is intentionally separate from the web runtime so future signed updates and game launching can be added without putting secrets in the desktop bundle.
