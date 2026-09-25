import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GameCard } from "@/components/game-card";
import type { GameSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=""}=await searchParams;
  const term=q.trim();
  const supabase = await createClient();
  let request=supabase.from("vertex_games").select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at").eq("status","published").order("updated_at",{ascending:false}).limit(40);
  if(term) request=request.ilike("title","%"+term+"%");
  const {data,error}=await request;
  const games=(data??[]) as GameSummary[];

  return <main className="page">
    <section className="hero" style={{padding:"30px 34px"}}>
      <div className="kicker">Discover</div>
      <h1 style={{fontSize:42,letterSpacing:"-.045em",margin:"8px 0"}}>Find your next favorite world.</h1>
      <p className="sub" style={{fontSize:15}}>Search published games, then build the catalog outward with categories, ranking, and creator discovery.</p>
      <form action="/discover" className="stack" style={{marginTop:18}}>
        <label style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:260}}><Search size={17} color="#a9a3b8"/><input className="input" name="q" defaultValue={term} placeholder="Search games…"/></label>
        <button className="btn primary" type="submit"><Sparkles size={16}/>Search</button>
      </form>
    </section>
    <section className="section">
      {error ? <div className="card empty"><h3>Catalog unavailable</h3><p className="meta">{error.message}</p></div> :
       games.length ? <div className="grid grid-4">{games.map(game=><GameCard key={game.id} game={game}/>)}</div> :
       <div className="card empty"><div className="empty-icon"><Search size={20}/></div><h3>{term?"No published games matched.":"No published games yet."}</h3><p className="meta">{term?"Try another title or create a new world.":"Vertex is ready for its first creator."}</p><Link className="btn primary" style={{marginTop:16}} href="/create">Create a game</Link></div>}
    </section>
  </main>;
}
