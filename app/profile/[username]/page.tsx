import Link from "next/link";
import { ArrowLeft, Gamepad2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { GameSummary } from "@/lib/types";
import { GameCard } from "@/components/game-card";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from("vertex_profiles")
    .select("user_id,username,display_name,avatar_url,bio,status,created_at")
    .eq("username", username.toLowerCase()).maybeSingle();

  if (!profile) return <main className="page"><div className="card empty"><div className="empty-icon"><UserRound size={20}/></div><h2>Profile not found</h2><Link className="btn" href="/discover" style={{marginTop:16}}><ArrowLeft size={14}/>Back to Discover</Link></div></main>;

  const { data: games } = await supabase.from("vertex_games")
    .select("id,title,slug,description,genre,status,age_rating,thumbnail_url,icon_url,current_version,likes_count,favorites_count,visits_count,published_at,updated_at")
    .eq("creator_id", profile.user_id).eq("status", "published")
    .order("visits_count", { ascending: false }).limit(8);

  return <main className="page">
    <Link className="btn sm ghost" href="/discover"><ArrowLeft size={14}/>Discover</Link>
    <section className="card pad" style={{marginTop:14}}>
      <div className="stack" style={{alignItems:"center"}}>
        <div className="avatar" style={{width:76,height:76,display:"grid",placeItems:"center",overflow:"hidden"}}>
          {profile.avatar_url ? <img src={profile.avatar_url} className="avatar" style={{width:"100%",height:"100%"}} alt="" /> : <UserRound size={30}/>}
        </div>
        <div><div className="kicker">Vertex creator</div><h1 style={{fontSize:38,letterSpacing:"-.04em",margin:"5px 0 1px"}}>{profile.display_name}</h1><div className="meta">@{profile.username} · {profile.status}</div></div>
      </div>
      {profile.bio && <p className="sub" style={{fontSize:15,marginTop:18}}>{profile.bio}</p>}
    </section>
    <section className="section">
      <div className="section-head"><div><h2 className="section-title"><Gamepad2 size={18} style={{verticalAlign:"-3px"}}/> Published worlds</h2><p className="section-copy">Games this creator has shipped to Vertex.</p></div></div>
      {games?.length ? <div className="grid grid-4">{(games as GameSummary[]).map(game => <GameCard key={game.id} game={game}/>)}</div> : <div className="card empty"><p className="meta">This creator has not published any worlds yet.</p></div>}
    </section>
  </main>;
}
