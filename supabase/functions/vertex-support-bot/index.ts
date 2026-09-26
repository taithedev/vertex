import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });

const SYSTEM = `
You are Vertex Support, the official in-site support assistant for the Vertex gaming platform.

Your job is to help users understand and use Vertex. Be friendly, concise, accurate, and practical. Never invent a feature, balance, game, policy, staff action, purchase, account state, or technical result.

Vertex facts:
- Vertex is a 12+ browser gaming platform.
- The frontend is static HTML/CSS/browser JavaScript hosted on Vercel. It does not use Next.js.
- Supabase is the backend source of truth for auth, profiles, games, likes, favorites, analytics, marketplace, messages, notifications, moderation, assets, matchmaking, and game-server control.
- Users can create an account with email/password or Google when Google OAuth is enabled.
- A Vertex profile has a username, display name, avatar, bio, status, discoverability, and date of birth.
- Users must be at least 12. The database rejects a saved birth date that indicates an age below 12.
- The navigation includes Home, Friends, Catalog, Avatar, Groups, Studio, Download, Marketplace, Messages, Notifications, and Settings.
- Published experiences can be discovered and played in the browser when a browser runtime exists for that experience.
- Vertex has Vertex Coins as its platform currency. New accounts receive 100 welcome coins. Signed-in users can claim a 25-coin daily reward once every 24 hours.
- Marketplace purchases spend Vertex Coins through a secure database transaction.
- Studio, analytics, and Asset Vault are creator-facing areas. Larger scene editing/script editing/new-game creation expansion is currently not active.
- Support lives inside Settings.
- Password recovery is available from the sign-in flow.
- Never ask for or expose passwords, API keys, service-role keys, OAuth secrets, or other private credentials.
- Do not claim you can directly change a user's account, issue coins, ban users, approve games, or modify staff permissions. Explain the available UI path instead.
- For bugs, ask for the exact error text and the page/feature where it happened when needed.
- When the user asks about something not in these facts, say what is known and clearly label uncertainty.

Current user context:
`;

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sign in to use Vertex Support." }, 401);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY") || Deno.env.get("AI_API_KEY");

    if (!url || !serviceRole || !groqKey) {
      return json({ error: "Vertex Support is not configured on the server yet." }, 503);
    }

    const admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const token = authorization.slice("Bearer ".length);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Your session is invalid. Sign in again." }, 401);

    let body: { message?: unknown } = {};
    try { body = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }

    const prompt = typeof body.message === "string" ? body.message.trim() : "";
    if (!prompt || prompt.length > 4000) return json({ error: "Messages must be between 1 and 4,000 characters." }, 400);

    const userId = authData.user.id;

    const { count } = await admin
      .from("vertex_support_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 60_000).toISOString());

    if ((count ?? 0) >= 8) {
      return json({ error: "Please wait a moment before sending another support message." }, 429, { "Retry-After": "60" });
    }

    const [{ data: profile }, { data: currency }, { count: gameCount }, { data: settings }] = await Promise.all([
      admin.from("vertex_profiles").select("username,display_name").eq("user_id", userId).maybeSingle(),
      admin.from("vertex_currency_accounts").select("balance").eq("user_id", userId).maybeSingle(),
      admin.from("vertex_games").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("vertex_platform_settings").select("site_name,announcement,maintenance_mode").eq("id", true).maybeSingle()
    ]);

    const { data: history } = await admin
      .from("vertex_support_messages")
      .select("role,content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(14);

    const userContext =
      `username: ${profile?.username ?? "unknown"}; display_name: ${profile?.display_name ?? "Vertex Player"}; ` +
      `Vertex Coins balance: ${currency?.balance ?? 0}; published experiences: ${gameCount ?? 0}; ` +
      `maintenance_mode: ${settings?.maintenance_mode ? "true" : "false"}; ` +
      `announcement: ${settings?.announcement ?? "none"}`;

    const messages = [
      { role: "system", content: SYSTEM + userContext },
      ...((history ?? []).reverse().map((m) => ({ role: m.role, content: m.content }))),
      { role: "user", content: prompt }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    let providerResponse: Response;
    try {
      providerResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + groqKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: Deno.env.get("VERTEX_SUPPORT_MODEL") || "openai/gpt-oss-120b",
          messages,
          temperature: 0.2,
          max_completion_tokens: 900
        }),
        signal: controller.signal
      });
    } catch {
      clearTimeout(timeout);
      return json({ error: "Vertex Support could not reach Groq right now." }, 503);
    }
    clearTimeout(timeout);

    if (providerResponse.status === 429) {
      return json({ error: "Vertex Support is temporarily rate-limited by Groq. Try again shortly." }, 429, { "Retry-After": "30" });
    }
    if (!providerResponse.ok) {
      return json({ error: "Groq could not complete the support request." }, 502);
    }

    let providerBody: { choices?: Array<{ message?: { content?: unknown } }> };
    try { providerBody = await providerResponse.json(); }
    catch { return json({ error: "Groq returned an invalid response." }, 502); }

    const answer = providerBody.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return json({ error: "Vertex Support returned an empty response." }, 502);

    await admin.from("vertex_support_messages").insert([
      { user_id: userId, role: "user", content: prompt },
      { user_id: userId, role: "assistant", content: answer.slice(0, 8000) }
    ]);

    return json({ answer });
  } catch {
    return json({ error: "Vertex Support encountered an unexpected server error." }, 500);
  }
});