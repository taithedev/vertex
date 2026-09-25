import Link from "next/link";
import { ArrowRight, Boxes, Gamepad2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GameCard } from "@/components/game-card";
import type { GameSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vertex_games")
    .select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at")
    .eq("status", "published")
    .order("visits_count", { ascending: false })
    .limit(8);

  const games = (data ?? []) as GameSummary[];

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="kicker">Play · Create · Publish</div>
            <h1 className="display">Your next world starts at Vertex.</h1>
            <p className="sub">
              A dark-first gaming platform for original games, creators, communities, and browser-playable worlds.
              Vertex is built around real publishing flows, real data, and a runtime that can grow with your games.
            </p>
            <div className="stack" style={{marginTop:22}}>
              <Link className="btn primary" href="/discover"><Gamepad2 size={17}/>Explore games</Link>
              <Link className="btn" href="/create"><Sparkles size={17}/>Create a world</Link>
            </div>
          </div>
          <div className="card pad">
            <div className="kicker">Vertex core</div>
            <h2 style={{fontSize:28,margin:"8px 0 6px",letterSpacing:"-.04em"}}>A platform, not a mockup.</h2>
            <p className="meta" style={{lineHeight:1.65}}>Auth, game metadata, publishing states, social primitives, moderation, and a WebGL runtime foundation share one system.</p>
            <div className="stack" style={{marginTop:15}}>
              <span className="pill"><Boxes size={13}/> Creator tools</span>
              <span className="pill"><Users size={13}/> Social</span>
              <span className="pill"><ShieldCheck size={13}/> Secure by default</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Featured worlds</h2>
            <p className="section-copy">Published experiences appear here as creators ship them.</p>
          </div>
          <Link className="btn sm" href="/discover">See all <ArrowRight size={14}/></Link>
        </div>
        {games.length ? (
          <div className="grid grid-4">{games.map(game => <GameCard key={game.id} game={game}/>)}</div>
        ) : (
          <div className="card empty">
            <div className="empty-icon"><Gamepad2 size={20}/></div>
            <h3 style={{margin:"0 0 6px"}}>The first worlds are waiting to be published.</h3>
            <p className="meta" style={{maxWidth:520,margin:"0 auto 18px"}}>Create a project in Vertex Studio, save a version, and submit it for review. Published games become discoverable here.</p>
            <Link className="btn primary" href="/studio">Open Vertex Studio</Link>
          </div>
        )}
      </section>
    </main>
  );
}
