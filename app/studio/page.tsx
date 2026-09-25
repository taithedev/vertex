import Link from "next/link";
import { Plus, Gamepad2, BarChart3, Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export default async function StudioPage() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return <main className="page"><div className="card empty"><div className="empty-icon"><Gamepad2 size={20}/></div><h2>Vertex Studio</h2><p className="meta">Sign in to create and manage your games.</p><Link className="btn primary" style={{marginTop:16}} href="/login">Sign in</Link></div></main>;

  const {data:games}=await supabase.from("vertex_games").select("id,title,slug,status,genre,current_version,visits_count,likes_count,updated_at").eq("creator_id",user.id).order("updated_at",{ascending:false});
  return <main className="page">
    <div className="section-head"><div><div className="kicker">Developer platform</div><h1 style={{fontSize:38,letterSpacing:"-.045em",margin:"7px 0 0"}}>Vertex Studio</h1><p className="section-copy">Build, test, version, and submit your worlds.</p></div><Link href="/create" className="btn primary"><Plus size={17}/>New game</Link></div>
    <div className="dashboard">
      <aside className="card side"><div className="section-title" style={{fontSize:15,marginBottom:8}}>Workspace</div><Link className="side-link active" href="/studio"><Gamepad2 size={16}/>Games</Link><Link className="side-link" href="/studio?tab=analytics"><BarChart3 size={16}/>Analytics</Link><Link className="side-link" href="/settings"><Settings2 size={16}/>Settings</Link></aside>
      <section className="grid" style={{gap:14}}>
        {games?.length ? games.map((game)=>(
          <Link key={game.id} href={`/studio/${game.id}`} className="card pad" style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"center"}}>
            <div><div className="stack"><span className="pill">{game.genre}</span><span className={`pill ${game.status==="published"?"success":game.status==="pending_review"?"warn":""}`}>{game.status.replace("_"," ")}</span></div><h2 style={{fontSize:20,margin:"8px 0 3px"}}>{game.title}</h2><p className="meta">v{game.current_version} · {game.visits_count.toLocaleString()} visits · {game.likes_count} likes</p></div>
            <span className="btn sm">Open</span>
          </Link>
        )):<div className="card empty"><div className="empty-icon"><Gamepad2 size={20}/></div><h3>No projects yet</h3><p className="meta">Your first game gets a versioned starter runtime automatically.</p><Link className="btn primary" style={{marginTop:16}} href="/create">Create a game</Link></div>}
      </section>
    </div>
  </main>;
}
