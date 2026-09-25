# Vertex server control

Private server registration/heartbeat endpoint for the Vertex game-session control plane.

Configure the Supabase Edge Function secret `VERTEX_GAME_SERVER_KEY`.

Expected header:

`x-vertex-server-key: <server secret>`

Actions:

- `register`: register a published game's server
- `heartbeat`: mark a server online and update capacity/version metadata
- `offline`: mark a server offline

The endpoint uses the Supabase service role internally and must never expose that key to a game client.