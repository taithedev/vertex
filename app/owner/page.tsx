import Link from "next/link";
import { Eye, Flag, Gavel, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OwnerStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="page"><div className="card empty"><h2>Owner Studio</h2><p className="meta">Sign in with an authorized Vertex staff account.</p><Link className="btn primary" href="/login" style={{marginTop:16}}>Sign in</Link></div></main>;

  const { data: staff } = await supabase.from("vertex_staff_roles").select("role,capabilities").eq("user_id", user.id).maybeSingle();
  if (!staff) return <main className="page"><div className="card empty"><div className="empty-icon"><ShieldCheck size={20}/></div><h2>Access denied</h2><p className="meta">This route is not visible to normal accounts.</p><Link className="btn" href="/">Return to Vertex</Link></div></main>;

  const [{ data: games }, { data: reports }, { data: logs }] = await Promise.all([
    supabase.from("vertex_games").select("id,title,status,genre,creator_id,updated_at").order("updated_at",{ascending:false}).limit(50),
    supabase.from("vertex_reports").select("id,target_type,target_id,reason,severity,status,created_at").order("created_at",{ascending:false}).limit(50),
    supabase.from("vertex_audit_logs").select("id,actor_id,action,target_type,target_id,created_at").order("created_at",{ascending:false}).limit(20)
  ]);

  async function reviewGame(formData: FormData) {
    "use server";
    const gameId=String(formData.get("gameId")??"");
    const status=String(formData.get("status")??"");
    if(!["published","paused","declined","removed","draft"].includes(status))return;
    const client=await createClient();
    const {data:{user}}=await client.auth.getUser();
    if(!user)return;
    const {data:role}=await client.from("vertex_staff_roles").select("role,capabilities").eq("user_id",user.id).maybeSingle();
    if(!role || (role.role!=="owner" && !role.capabilities.includes("review_games")))return;
    const update=status==="published"?{status,published_at:new Date().toISOString()}:{status};
    const {error}=await client.from("vertex_games").update(update).eq("id",gameId);
    if(!error)await client.from("vertex_audit_logs").insert({actor_id:user.id,action:"game_status_changed",target_type:"game",target_id:gameId,metadata:{status}});
  }

  async function resolveReport(formData:FormData) {
    "use server";
    const reportId=String(formData.get("reportId")??"");
    const status=String(formData.get("status")??"resolved");
    const client=await createClient();
    const {data:{user}}=await client.auth.getUser();
    if(!user)return;
    const {data:role}=await client.from("vertex_staff_roles").select("role,capabilities").eq("user_id",user.id).maybeSingle();
    if(!role || (role.role!=="owner" && !role.capabilities.includes("view_reports")))return;
    const {error}=await client.from("vertex_reports").update({status,resolved_at:new Date().toISOString()}).eq("id",reportId);
    if(!error)await client.from("vertex_audit_logs").insert({actor_id:user.id,action:"report_status_changed",target_type:"report",metadata:{status,reportId}});
  }

  return <main className="page">
    <div className="section-head"><div><div className="kicker">Restricted control center</div><h1 style={{fontSize:42,letterSpacing:"-.05em",margin:"7px 0"}}>Owner Studio</h1><p className="section-copy">Moderation, staff, games, reports, marketplace, economy, security, logs, and platform settings.</p></div><span className="pill"><ShieldCheck size={13}/>{staff.role}</span></div>
    <div className="metric-grid">
      <div className="metric"><Users size={17}/><div className="metric-value">{games?.length??0}</div><div className="metric-label">Games loaded</div></div>
      <div className="metric"><Flag size={17}/><div className="metric-value">{reports?.filter(x=>x.status==="open").length??0}</div><div className="metric-label">Open reports</div></div>
      <div className="metric"><Gavel size={17}/><div className="metric-value">{logs?.length??0}</div><div className="metric-label">Recent audit events</div></div>
      <div className="metric"><Eye size={17}/><div className="metric-value">{games?.filter(x=>x.status==="pending_review").length??0}</div><div className="metric-label">Pending review</div></div>
    </div>
    <section className="section"><div className="section-head"><div><h2 className="section-title">Game review queue</h2><p className="section-copy">Only authorized staff can change publication state.</p></div></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Game</th><th>State</th><th>Genre</th><th>Action</th></tr></thead><tbody>
        {games?.map(g=><tr key={g.id}><td><Link href={"/games/"+g.id}><strong>{g.title}</strong></Link></td><td><span className={"pill "+(g.status==="pending_review"?"warn":"")}>{g.status.replace("_"," ")}</span></td><td className="meta">{g.genre}</td><td><form action={reviewGame} className="stack"><input type="hidden" name="gameId" value={g.id}/>{g.status==="pending_review"&&<><button className="btn sm primary" name="status" value="published">Approve</button><button className="btn sm" name="status" value="declined">Decline</button></>}{g.status==="published"&&<button className="btn sm" name="status" value="paused">Pause</button>}</form></td></tr>)}
      </tbody></table></div>
    </section>
    <section className="section"><div className="section-head"><div><h2 className="section-title">Reports</h2><p className="section-copy">Report queue with auditable resolution actions.</p></div></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Type</th><th>Reason</th><th>Severity</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {reports?.map(r=><tr key={r.id}><td>{r.target_type}</td><td>{r.reason}</td><td><span className="pill">{r.severity}</span></td><td>{r.status}</td><td>{r.status==="open"&&<form action={resolveReport}><input type="hidden" name="reportId" value={r.id}/><button className="btn sm" name="status" value="resolved">Resolve</button></form>}</td></tr>)}
      </tbody></table></div>
    </section>
  </main>;
}
