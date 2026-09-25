import Link from "next/link";
import { ArrowLeft, BarChart3, Gamepad2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export default async function AnalyticsPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return <main className="page"><div className="card empty"><h2>Sign in to view analytics</h2><Link href="/login" className="btn primary" style={{marginTop:16}}>Sign in</Link></div></main>;
  const {data:games}=await supabase.from("vertex_games").select("id,title,status,visits_count,likes_count,favorites_count").eq("creator_id",user.id).order("visits_count",{ascending:false});
  const gameIds=(games??[]).map(g=>g.id);
  const {data:daily}=gameIds.length?await supabase.from("vertex_game_analytics_daily").select("game_id,day,visits,unique_players,browser_sessions,desktop_sessions").in("game_id",gameIds).order("day",{ascending:false}).limit(90):{data:[]};
  const visits=(games??[]).reduce((sum,g)=>sum+Number(g.visits_count??0),0);
  const likes=(games??[]).reduce((sum,g)=>sum+Number(g.likes_count??0),0);
  const favorites=(games??[]).reduce((sum,g)=>sum+Number(g.favorites_count??0),0);
  return <main className="page">
    <Link href="/studio" className="btn sm ghost"><ArrowLeft size={14}/>Studio</Link>
    <div className="section-head" style={{marginTop:14}}><div><div className="kicker">Creator analytics</div><h1 style={{fontSize:40,letterSpacing:"-.05em",margin:"7px 0"}}>Analytics</h1><p className="section-copy">Visits are de-duplicated by browser session per game/day. Daily rows are ready for charts and retention views.</p></div></div>
    <div className="metric-grid">
      <div className="metric"><Gamepad2 size={17}/><div className="metric-value">{games?.length??0}</div><div className="metric-label">Published + draft games</div></div>
      <div className="metric"><BarChart3 size={17}/><div className="metric-value">{visits.toLocaleString()}</div><div className="metric-label">Total visits</div></div>
      <div className="metric"><Users size={17}/><div className="metric-value">{likes.toLocaleString()}</div><div className="metric-label">Likes</div></div>
      <div className="metric"><Users size={17}/><div className="metric-value">{favorites.toLocaleString()}</div><div className="metric-label">Favorites</div></div>
    </div>
    <section className="section"><div className="table-wrap"><table className="table"><thead><tr><th>Game</th><th>Status</th><th>Visits</th><th>Likes</th><th>Favorites</th></tr></thead><tbody>{games?.map(g=><tr key={g.id}><td><strong>{g.title}</strong></td><td><span className="pill">{g.status}</span></td><td>{Number(g.visits_count).toLocaleString()}</td><td>{g.likes_count.toLocaleString()}</td><td>{g.favorites_count.toLocaleString()}</td></tr>)}</tbody></table></div></section>
    <section className="section"><div className="section-head"><div><h2 className="section-title">Daily data</h2><p className="section-copy">{daily?.length??0} aggregate rows loaded.</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>Day</th><th>Game</th><th>Visits</th><th>Unique signed-in</th><th>Browser</th><th>Desktop</th></tr></thead><tbody>{daily?.map(row=><tr key={row.game_id+"-"+row.day}><td>{row.day}</td><td>{games?.find(g=>g.id===row.game_id)?.title??row.game_id.slice(0,8)}</td><td>{Number(row.visits).toLocaleString()}</td><td>{Number(row.unique_players).toLocaleString()}</td><td>{Number(row.browser_sessions).toLocaleString()}</td><td>{Number(row.desktop_sessions).toLocaleString()}</td></tr>)}</tbody></table></div></section>
  </main>;
}
