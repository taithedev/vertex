import Link from "next/link";
import { ArrowLeft, Box, Code2, Eye, Save, Send, Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export default async function GameStudioPage({params}:{params:Promise<{gameId:string}>}) {
  const {gameId}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return <main className="page"><div className="card empty"><h2>Sign in required</h2><Link className="btn primary" href="/login">Sign in</Link></div></main>;
  const {data:game}=await supabase.from("vertex_games").select("*").eq("id",gameId).eq("creator_id",user.id).single();
  if(!game) return <main className="page"><div className="card empty"><h2>Project not found</h2><Link className="btn" href="/studio">Back</Link></div></main>;

  async function submitForReview() {
    "use server";
    const client=await createClient();
    const {data:{user}}=await client.auth.getUser();
    if(!user) return;
    await client.from("vertex_games").update({status:"pending_review"}).eq("id",gameId).eq("creator_id",user.id);
  }

  return <main className="page">
    <div className="stack"><Link href="/studio" className="btn sm ghost"><ArrowLeft size={14}/>All games</Link><Link href={`/games/${game.id}`} className="btn sm"><Eye size={14}/>Game page</Link></div>
    <div className="section-head" style={{marginTop:18}}><div><div className="kicker">Editor</div><h1 style={{fontSize:38,letterSpacing:"-.04em",margin:"7px 0 0"}}>{game.title}</h1><p className="section-copy">Version {game.current_version} · {game.status}</p></div><form action={submitForReview}><button className="btn primary" type="submit" disabled={game.status==="pending_review"}><Send size={15}/>{game.status==="pending_review"?"In review":"Submit for review"}</button></form></div>
    <section className="card" style={{overflow:"hidden",marginTop:18}}>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr 280px",minHeight:520}}>
        <aside style={{padding:14,borderRight:"1px solid var(--line)"}}><div className="section-title" style={{fontSize:14,marginBottom:10}}>Hierarchy</div><div className="side-link active"><Box size={15}/>Starter World</div><div className="side-link"><Box size={15}/>Spawn</div><div className="side-link"><Box size={15}/>Ground</div><div className="side-link"><Box size={15}/>Player</div></aside>
        <div style={{display:"grid",gridTemplateRows:"1fr 150px",background:"radial-gradient(circle at 50% 40%, rgba(168,85,247,.08), transparent 38%), #08070c"}}>
          <div style={{display:"grid",placeItems:"center",padding:30,textAlign:"center"}}><div><div className="pill"><Box size={13}/>WebGL runtime viewport foundation</div><h2 style={{fontSize:28,margin:"14px 0 6px"}}>Starter World</h2><p className="meta" style={{maxWidth:440,margin:"0 auto"}}>The editor stores a versioned runtime configuration. Browser play renders it through Three.js instead of an iframe or screenshot.</p><Link href={`/play/${game.id}`} className="btn primary" style={{marginTop:18}}><Eye size={15}/>Playtest</Link></div></div>
          <div style={{borderTop:"1px solid var(--line)",padding:14}}><div className="stack"><span className="pill"><Code2 size={13}/>Script editor foundation</span><span className="pill"><Save size={13}/>Autosave-ready</span><span className="pill"><Settings2 size={13}/>Inspector</span></div></div>
        </div>
        <aside style={{padding:14,borderLeft:"1px solid var(--line)"}}><div className="section-title" style={{fontSize:14,marginBottom:10}}>Inspector</div><div className="field"><label className="label">Runtime</label><div className="card pad meta">Starter WebGL scene</div></div><div className="field"><label className="label">Age rating</label><div className="card pad meta">{game.age_rating}</div></div><div className="field"><label className="label">Status</label><div className="card pad meta">{game.status}</div></div></aside>
      </div>
    </section>
  </main>;
}
