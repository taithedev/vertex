import Link from "next/link";
import { ArrowLeft, Bell, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export default async function NotificationsPage() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return <main className="page"><div className="card empty"><h2>Sign in to view notifications</h2><Link className="btn primary" style={{marginTop:16}} href="/login">Sign in</Link></div></main>;
  const {data}=await supabase.from("vertex_notifications").select("id,type,title,body,action_url,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  return <main className="page" style={{maxWidth:900}}>
    <Link className="btn sm ghost" href="/"><ArrowLeft size={14}/>Home</Link>
    <div className="section-head" style={{marginTop:14}}><div><div className="kicker">Updates</div><h1 style={{fontSize:38,letterSpacing:"-.04em",margin:"7px 0 0"}}>Notifications</h1></div><div className="pill"><Bell size={13}/>{data?.filter(x=>!x.read_at).length ?? 0} unread</div></div>
    <section className="grid" style={{gap:10}}>
      {data?.length ? data.map(n=><Link key={n.id} href={n.action_url ?? "#"} className="card pad" style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"center"}}><Circle size={9} fill={n.read_at?"transparent":"#c084fc"} color={n.read_at?"#5c536a":"#c084fc"}/><div><strong>{n.title}</strong><p className="meta" style={{margin:"4px 0 0"}}>{n.body}</p></div><span className="meta">{new Date(n.created_at).toLocaleDateString()}</span></Link>):<div className="card empty"><div className="empty-icon"><Bell size={20}/></div><h3>All caught up</h3><p className="meta">Realtime notifications will appear here as social and developer events happen.</p></div>}
    </section>
  </main>;
}
