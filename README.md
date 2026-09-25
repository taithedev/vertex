# Vertex

Vertex is an original user-generated gaming platform for playing, discovering, creating, publishing, and moderating community-made worlds.

## Stack

The web app uses Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase. Supabase provides Auth, PostgreSQL, Storage, and Realtime. Vercel is the intended web deployment target. A Tauri 2 desktop launcher foundation lives under apps/desktop.

## Independence

Vertex has its own codebase, branding, data model, permissions, storage layout, and runtime foundation. It is not a merge or clone of another application.

## Repository layout

app/ contains the public website, game routes, authentication pages, developer studio, marketplace, social pages, protected owner area, and server endpoints.

components/ contains reusable Vertex UI and browser runtime components.

lib/ contains Supabase clients, shared types, validation, and helpers.

supabase/migrations/ contains ordered database migrations.

apps/desktop/ contains the Tauri launcher foundation.

docs/ contains architecture, security, and runtime notes.

tests/ contains automated checks.

## Local development

Create a local environment file from .env.example and provide the Supabase URL and publishable key. Server-only owner bootstrap requires a Supabase secret key and the configured owner email.

Install dependencies with npm install.

Run npm run typecheck, npm run lint, npm test, and npm run build before deployment.

Run npm run dev for the web application.

## Authentication

Supabase Auth handles email/password accounts and browser sessions. A database trigger automatically creates a Vertex profile and currency account for newly created Auth users.

The browser only receives the publishable Supabase key. Server-only secrets must never be committed or embedded in client code.

## Database

The Vertex tables are isolated under the vertex_ prefix inside the connected Supabase project. Existing unrelated tables in the project were left untouched.

Core systems include profiles, games, game versions, collaboration, likes, favorites, follows, friendships, conversations, messages, notifications, currency, marketplace inventory and purchases, badges, achievements, reports, staff roles, audit logs, settings, comments, and daily analytics architecture.

RLS is enabled for Vertex data. Sensitive role checks happen in PostgreSQL. Marketplace purchases use a protected database transaction that checks authentication, item state, ownership, and available balance before changing the ledger.

## Game runtime

The browser route /play/gameId uses a real Three.js WebGL renderer with a procedural starter scene. It is not an iframe or a screenshot.

The runtime boundary is intentionally limited. Arbitrary game code is not given access to server secrets, database credentials, or trusted infrastructure APIs.

A dedicated authoritative networking service is still required for production multiplayer. Supabase Realtime is used for platform/social realtime, not high-frequency game simulation.

## Publishing

Creators start in Draft. They can submit for review. Authorized reviewers can approve, pause, decline, or remove games. A database trigger prevents non-reviewers from changing protected publication states.

## Owner bootstrap

Set VERTEX_OWNER_EMAIL plus a server-only Supabase secret, then send an authenticated POST request to /api/owner/bootstrap from the owner account once. The endpoint refuses to create a second owner.

Owner Studio is available at /owner and is protected by database-backed staff roles.

## Storage

Vertex creates public buckets for assets that are meant to be publicly displayed and private buckets for game assets and message media. Upload policies require authentication and user-scoped folders.

## Desktop

apps/desktop is a lightweight Tauri launcher foundation. It does not contain platform secrets or run arbitrary game code. Future milestones can add authenticated launcher state, installed-game tracking, signed updates, and a validated custom protocol.

## Deployment

The intended web deployment is Vercel. Configure the variables from .env.example in the Vercel project, then run the same local checks before publishing.

The current connected Vercel integration could not be inspected from this build session because the connector returned an authorization error. The GitHub repository is ready for its existing Vercel Git integration if configured.

## Testing and quality

The repository contains validation tests plus TypeScript, ESLint, and production-build checks. Runtime and database verification are also performed against the connected Supabase project.

## Known limitations

This build is a strong production foundation, not a claim that a full Roblox-scale platform has already been finished.

The remaining major infrastructure milestone is a dedicated authoritative multiplayer/game-server service. The Tauri launcher is a foundation rather than a published installer. Advanced studio editing, arbitrary user scripting, game asset pipelines, retention dashboards, account recovery UX, and large-scale anti-abuse automation need additional implementation.

No fake live server counts, fake analytics, or fake payment flows are presented as completed features.
