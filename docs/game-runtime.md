# Vertex game runtime

The current browser runtime is a real Three.js WebGL foundation with:

- a scene
- camera
- lighting
- materials
- procedural starter geometry
- resize handling
- FPS telemetry
- a runtime HUD

The next runtime milestone is to define a signed, versioned asset manifest and a sandboxed client scripting API. Arbitrary platform/server code is not exposed to games.

Multiplayer is intentionally separated from Supabase Realtime. A dedicated authoritative game-network service must provide rooms, matchmaking, state replication, reconnects, server discovery, and private server controls before those features are presented as live.
