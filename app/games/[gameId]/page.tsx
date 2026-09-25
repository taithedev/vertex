import Link from "next/link";
import { CalendarDays, Play, ShieldCheck, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { GameSummary } from "@/lib/types";
import { GameCard } from "@/components/game-card";
import { GameActions } from "@/components/game-actions";
import { GameComments } from "@/components/game-comments";

export const dynamic="force-dynamic";

export default async function GamePage({params}:{params:Promise<{gameId:string}>}) {
  const {gameId}=await params;
  const supabase=await createClient();
  const {data:game}=await supabase.from("vertex_games").select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at,creator_id").eq("id",gameId).single();
  if(!game)return <main className="page"><div className="card empty"><h2>Game not found</h2><Link className="btn" href="/discover">Back to Discover</Link></div></main>;

  const [{data:creator},{data:related}]=await Promise.all([
    supabase.from("vertex_profiles").select("username,display_name,avatar_url").eq("user_id",game.creator_id).maybeSingle(),
    supabase.from("vertex_games").select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at").eq("status","published").eq("genre",game.genre).neq("id",game.id).limit(4)
  ]);
  const published=game.status==="published";
  return <main className="page">
    <section className="hero" style={{padding:0,overflow:"hidden"}}>
      <img src={game.thumbnail_url ?? "https://picsum.photos/seed/"+game.id+"/1400/500"} alt="" style={{width:"100%",height:360,objectFit:"cover",display:"block",background:"#171222"}}/>
      <div style={{padding:28}}>
        <div className="stack"><span className="pill">{game.genre}</span><span className="pill"><ShieldCheck size={13}/>{game.age_rating}</span><span className={"pill "+(published?"success":"")}>{game.status.replace("_"," ")}</span></div>
        <div className="section-head" style={{marginTop:12}}><div><h1 style={{fontSize:44,letterSpacing:"-.05em",margin:0}}>{game.title}</h1><p className="sub" style={{fontSize:15,marginTop:10}}>{game.description||"No description yet."}</p></div>{published&&<Link href={"/play/"+game.id} className="btn primary"><Play size={16}/>Play</Link>}</div>
        <div className="stack" style={{marginTop:18}}><span className="pill"><Users size={13}/>{game.visits_count.toLocaleString()} visits</span><span className="pill"><Star size={13}/>{game.favorites_count.toLocaleString()} favorites</span><span className="pill"><CalendarDays size={13}/>v{game.current_version}</span></div>
        <div style={{marginTop:16}}><GameActions gameId={game.id}/></div>
      </div>
    </section>
    <section className="section grid grid-2">
      <div className="card pad"><div className="kicker">Creator</div><div className="stack" style={{alignItems:"center",marginTop:12}}>
        <div className="avatar" style={{width:48,height:48,display:"grid",placeItems:"center",overflow:"hidden"}}>{creator?.avatar_url?<img src={creator.avatar_url} className="avatar" style={{width:"100%",height:"100%"}} alt=""/>:<Users size={18}/>}</div>
        <div><Link href={creator?.username?"/profile/"+creator.username:"#"} style={{fontWeight:800}}>{creator?.display_name??"Vertex creator"}</Link><div className="meta">@{creator?.username??"unknown"}</div></div>
      </div></div>
      <div className="card pad"><div className="kicker">Servers</div><h3 style={{margin:"8px 0 5px"}}>{published?"Live runtime sessions only":"Not launchable yet"}</h3><p className="meta">Vertex never invents server counts. A dedicated game-network service will publish live sessions here when multiplayer is connected.</p></div>
    </section>
    {published&&<section className="section"><GameComments gameId={game.id}/></section>}
    <section className="section"><div className="section-head"><div><h2 className="section-title">Related worlds</h2><p className="section-copy">More published games in {game.genre}.</p></div></div>{related?.length?<div className="grid grid-4">{(related as GameSummary[]).map(x=><GameCard key={x.id} game={x}/>)}</div>:<div className="card empty"><p className="meta">No related worlds yet.</p></div>}</section>
  </main>;
}
