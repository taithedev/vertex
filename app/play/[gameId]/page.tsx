import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GameRuntime } from "@/components/game-runtime";
import { GamePresence } from "@/components/game-presence";
import { GameVisitTracker } from "@/components/game-visit-tracker";
import { FullscreenButton } from "@/components/fullscreen-button";

export const dynamic="force-dynamic";

export default async function PlayPage({params}:{params:Promise<{gameId:string}>}) {
  const {gameId}=await params;
  const supabase=await createClient();
  const {data:game}=await supabase.from("vertex_games").select("id,title,status,runtime_config,current_version").eq("id",gameId).eq("status","published").single();
  if(!game)return <main className="page"><div className="card empty"><h2>Game unavailable</h2><p className="meta">Only published games can be launched in the browser runtime.</p><Link href="/discover" className="btn primary" style={{marginTop:16}}>Back to discover</Link></div></main>;

  return <div className="play-shell">
    <GameVisitTracker gameId={game.id}/>
    <div className="play-toolbar">
      <div className="stack" style={{alignItems:"center"}}><Link href={"/games/"+game.id} className="btn sm ghost"><ArrowLeft size={14}/>Leave</Link><div><strong>{game.title}</strong><div className="meta">v{game.current_version}</div></div></div>
      <div className="stack"><span className="pill">Browser WebGL</span><FullscreenButton/></div>
    </div>
    <div className="runtime-wrap">
      <GameRuntime config={(game.runtime_config??{}) as Record<string,unknown>}/>
      <div className="runtime-hud"><GamePresence gameId={game.id}/></div>
    </div>
  </div>;
}
