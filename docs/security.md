# Vertex security model

- Supabase publishable keys are intended for browser use; service secrets are never committed.
- RLS is enabled on Vertex tables.
- Sensitive role decisions are evaluated server-side or in PostgreSQL.
- Publishing state is protected by a database trigger.
- Marketplace purchases run inside a security-definer PostgreSQL transaction that verifies auth.uid(), current price, ownership, and available balance.
- Currency changes create ledger entries.
- Storage uploads are restricted to authenticated users and scoped by user-owned folders.
- User-facing failures return safe messages; technical details should remain server-side.
- Vertex does not claim perfect safety; moderation, rate limiting, and layered access controls are part of the design.
