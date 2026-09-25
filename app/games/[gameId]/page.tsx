import Link from "next/link";
import { CalendarDays, Play, Server, ShieldCheck, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { GameSummary } from "@/lib/types";
import { GameCard } from "@/components/game-card";
import { GameActions } from "@/components/game-actions";
import { GameComments } from "@/components/game-comments";
import { MatchmakingButton } from "@/components/matchmaking-button";

export const dynamic="force-dynamic";

export default async function GamePage({params}:{params:Promise<{gameId:string}>}) {
  const {gameId}=await params;
  const supabase=await createClient();
  const {data:game}=await supabase.from("vertex_games").select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at,creator_id").eq("id",gameId).single();
  if(!game)return <main className="page"><div className="card empty"><h2>Game not found</h2><Link className="btn" href="/discover">Back to Discover</Link></div></main>;

  const [{data:creator},{data:related},{data:servers}]=await Promise.all([
    supabase.from("vertex_profiles").select("username,display_name,avatar_url").eq("user_id",game.creator_id).maybeSingle(),
    supabase.from("vertex_games").select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at").eq("status","published").eq("genre",game.genre).neq("id",game.id).limit(4),
    game.status==="published"?supabase.from("vertex_game_servers").select("id,region,current_players,max_players,version").eq("game_id",game.id).eq("status","online").order("current_players",{ascending:true}).limit(20):Promise.resolve({data:[]})
  ]);
  const published=game.status==="published";

  return <main className="page">
    <section className="hero" style={{padding:0,overflow:"hidden"}}>
      {game.thumbnail_url?<img src={game.thumbnail_url} alt="" style={{width:"100%",height:360,objectFit:"cover",display:"block",background:"#171222"}}/>:<div className="game-cover game-cover-fallback" style={{height:360,width:"100%"}}><span>Vertex</span><strong>{game.title}</strong></div>}
      <div style={{padding:28}}>
        <div className="stack"><span className="pill">{game.genre}</span><span className="pill"><ShieldCheck size={13}/>{game.age_rating}</span><span className={"pill "+(published?"success":"")}>{game.status.replace("_"," ")}</span></div>
        <div className="section-head" style={{marginTop:12}}><div><h1 style={{fontSize:44,letterSpacing:"-.05em",margin:0}}>{game.title}</h1><p className="sub" style={{fontSize:15,marginTop:10}}>{game.description||"No description yet."}</p></div>{published&&<Link href={"/play/"+game.id} className="btn primary"><Play size={16}/>Play</Link>}</div>
        <div className="stack" style={{marginTop:18}}><span className="pill"><Users size={13}/>{game.visits_count.toLocaleString()} visits</span><span className="pill"><Star size={13}/>{game.favorites_count.toLocaleString()} favorites</span><span className="pill"><CalendarDays size={13}/>v{game.current_version}</span></div>
        <div style={{marginTop:16}}><GameActions gameId={game.id}/></div>
      </div>
    </section>
    {published&&<section className="section card pad"><div className="section-head"><div><h2 className="section-title"><Server size={17} style={{verticalAlign:"-3px"}}/> Multiplayer</h2><p className="section-copy">Browser rooms use lightweight realtime presence. Server-authoritative simulation can plug into the same session control plane.</p></div><MatchmakingButton gameId={game.id}/></div>
      {servers?.length?<div className="grid grid-3">{servers.map(s=><div key={s.id} className="card pad"><div className="stack" style={{justifyContent:"space-between"}}><span className="pill success">Online</span><span className="meta">{s.region}</span></div><h3 style={{margin:"10px 0 4px"}}>{s.current_players}/{s.max_players} players</h3><p className="meta">Runtime v{s.version}</p><Link className="btn sm" style={{marginTop:10}} href={"/play/"+game.id}>Join browser room</Link></div>)}</div>:<div className="card empty" style={{marginTop:12,padding:"26px"}}><p className="meta">No registered dedicated servers right now. You can still join the browser presence room.</p></div>}
    </section>}
    <section className="section grid grid-2">
      <div className="card pad"><div className="kicker">Creator</div><div className="stack" style={{alignItems:"center",marginTop:12}}><div className="avatar" style={{width:48,height:48,display:"grid",placeItems:"center",overflow:"hidden"}}>{creator?.avatar_url?<img src={creator.avatar_url} className="avatar" style={{width:"100%",height:"100%"}} alt=""/>:<Users size={18}/>}</div><div><Link href={creator?.username?"/profile/"+creator.username:"#"} style={{fontWeight:800}}>{creator?.display_name??"Vertex creator"}</Link><div className="meta">@{creator?.username??"unknown"}</div></div></div></div>
      <div className="card pad"><div className="kicker">Servers</div><h3 style={{margin:"8px 0 5px"}}>{published?"Live session registry":"Not launchable yet"}</h3><p className="meta">Vertex only shows registered sessions and does not invent server counts.</p></div>
    </section>
    {published&&<section className="section"><GameComments gameId={game.id}/></section>}
    <section className="section"><div className="section-head"><div><h2 className="section-title">Related worlds</h2><p className="section-copy">More published games in {game.genre}.</p></div></div>{related?.length?<div className="grid grid-4">{(related as GameSummary[]).map(x=><GameCard key={x.id} game={x}/>)}</div>:<div className="card empty"><p className="meta">No related worlds yet.</p></div>}</section>
  </main>;
}
