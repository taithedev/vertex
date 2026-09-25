import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { GameSummary } from "@/lib/types";
import { GameCard } from "@/components/game-card";

export const dynamic="force-dynamic";

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=""}=await searchParams;
  const term=q.trim();
  const supabase=await createClient();
  const [{data:games},{data:profiles}]=await Promise.all([
    term ? supabase.from("vertex_games").select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at").eq("status","published").ilike("title","%"+term+"%").limit(30) : Promise.resolve({data:[]}),
    term ? supabase.from("vertex_profiles").select("username,display_name,avatar_url").eq("discoverable",true).ilike("username","%"+term+"%").limit(20) : Promise.resolve({data:[]})
  ]);
  return <main className="page">
    <section className="hero" style={{padding:"28px 34px"}}><div className="kicker">Global search</div><h1 style={{fontSize:40,letterSpacing:"-.05em",margin:"7px 0"}}>Search Vertex</h1><form className="stack" action="/search" style={{marginTop:18}}><input className="input" name="q" defaultValue={term} placeholder="Games and usernames…" autoFocus/><button className="btn primary" type="submit"><Search size={16}/>Search</button></form></section>
    {!term ? <div className="section card empty"><p className="meta">Enter a game title or username to search.</p></div> :
      <><section className="section"><div className="section-head"><div><h2 className="section-title">Games</h2><p className="section-copy">Published experiences matching “{term}”.</p></div></div>{games?.length?<div className="grid grid-4">{(games as GameSummary[]).map(g=><GameCard key={g.id} game={g}/>)}</div>:<div className="card empty"><p className="meta">No published games matched.</p></div>}</section>
      <section className="section"><div className="section-head"><div><h2 className="section-title">Creators</h2><p className="section-copy">Discoverable usernames matching the search.</p></div></div>{profiles?.length?<div className="grid grid-3">{profiles.map(p=><Link key={p.username} className="card pad" href={"/profile/"+p.username}><div className="stack" style={{alignItems:"center"}}>{p.avatar_url?<img src={p.avatar_url} className="avatar" alt="" />:<div className="avatar" style={{display:"grid",placeItems:"center"}}><Search size={15}/></div>}<div><strong>{p.display_name}</strong><div className="meta">@{p.username}</div></div></div></Link>)}</div>:<div className="card empty"><p className="meta">No creators matched.</p></div>}</section></>}
  </main>;
}
