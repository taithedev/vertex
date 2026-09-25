import Link from "next/link";
import { Eye, Flag, Gavel, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

const staffRoles=["manager","admin","developer","senior_moderator","moderator","support"] as const;
const moderationStatuses=["active","muted","suspended","banned"] as const;

export default async function OwnerStudioPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return <main className="page"><div className="card empty"><h2>Owner Studio</h2><p className="meta">Sign in with an authorized Vertex staff account.</p><Link className="btn primary" href="/login" style={{marginTop:16}}>Sign in</Link></div></main>;

  const {data:staff}=await supabase.from("vertex_staff_roles").select("role,capabilities").eq("user_id",user.id).maybeSingle();
  if(!staff)return <main className="page"><div className="card empty"><div className="empty-icon"><ShieldCheck size={20}/></div><h2>Access denied</h2><p className="meta">This route is not visible to normal accounts.</p><Link className="btn" href="/">Return to Vertex</Link></div></main>;

  const [{data:games},{data:reports},{data:logs},{data:moderation},{data:staffRows}]=await Promise.all([
    supabase.from("vertex_games").select("id,title,status,genre,creator_id,updated_at").order("updated_at",{ascending:false}).limit(50),
    supabase.from("vertex_reports").select("id,target_type,target_id,reason,severity,status,created_at").order("created_at",{ascending:false}).limit(50),
    supabase.from("vertex_audit_logs").select("id,actor_id,action,target_type,target_id,created_at").order("created_at",{ascending:false}).limit(20),
    supabase.from("vertex_user_moderation").select("user_id,status,reason,expires_at,updated_at").order("updated_at",{ascending:false}).limit(50),
    supabase.from("vertex_staff_roles").select("user_id,role,capabilities,updated_at").order("updated_at",{ascending:false}).limit(50)
  ]);

  async function reviewGame(formData:FormData){
    "use server";
    const gameId=String(formData.get("gameId")??""),status=String(formData.get("status")??"");
    if(!["published","paused","declined","removed","draft"].includes(status))return;
    const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)return;
    const {data:role}=await client.from("vertex_staff_roles").select("role,capabilities").eq("user_id",user.id).maybeSingle();
    if(!role || (role.role!=="owner" && !role.capabilities.includes("review_games")))return;
    const update=status==="published"?{status,published_at:new Date().toISOString()}:{status};
    const {error}=await client.from("vertex_games").update(update).eq("id",gameId);
    if(!error)await client.from("vertex_audit_logs").insert({actor_id:user.id,action:"game_status_changed",target_type:"game",target_id:gameId,metadata:{status}});
  }

  async function resolveReport(formData:FormData){
    "use server";
    const reportId=String(formData.get("reportId")??""),status=String(formData.get("status")??"resolved");
    const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)return;
    const {data:role}=await client.from("vertex_staff_roles").select("role,capabilities").eq("user_id",user.id).maybeSingle();
    if(!role || (role.role!=="owner" && !role.capabilities.includes("view_reports")))return;
    const {error}=await client.from("vertex_reports").update({status,resolved_at:new Date().toISOString()}).eq("id",reportId);
    if(!error)await client.from("vertex_audit_logs").insert({actor_id:user.id,action:"report_status_changed",target_type:"report",metadata:{status,reportId}});
  }

  async function moderateUser(formData:FormData){
    "use server";
    const username=String(formData.get("username")??"").trim().toLowerCase().replace(/^@/,"");
    const status=String(formData.get("status")??"active");
    const reason=String(formData.get("reason")??"").trim().slice(0,500);
    const expiresAtRaw=String(formData.get("expiresAt")??"").trim();
    if(!username || !moderationStatuses.includes(status as typeof moderationStatuses[number]))return;
    const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)return;
    const {data:role}=await client.from("vertex_staff_roles").select("role,capabilities").eq("user_id",user.id).maybeSingle();
    if(!role || (role.role!=="owner" && !role.capabilities.includes("moderate_users")))return;
    const {data:target}=await client.from("vertex_profiles").select("user_id").eq("username",username).maybeSingle();if(!target)return;
    const expiresAt=expiresAtRaw?new Date(expiresAtRaw).toISOString():null;
    const {error}=await client.from("vertex_user_moderation").upsert({user_id:target.user_id,status,reason:reason||null,expires_at:expiresAt,updated_by:user.id},{onConflict:"user_id"});
    if(!error)await client.from("vertex_audit_logs").insert({actor_id:user.id,action:"user_moderation_changed",target_type:"user",target_id:target.user_id,metadata:{status,reason,expiresAt}});
  }

  async function saveStaff(formData:FormData){
    "use server";
    const username=String(formData.get("username")??"").trim().toLowerCase().replace(/^@/,"");
    const role=String(formData.get("role")??"");
    const capabilityText=String(formData.get("capabilities")??"");
    const action=String(formData.get("action")??"save");
    const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)return;
    const {data:actor}=await client.from("vertex_staff_roles").select("role,capabilities").eq("user_id",user.id).maybeSingle();
    if(!actor || (actor.role!=="owner" && !actor.capabilities.includes("manage_staff")))return;
    const {data:target}=await client.from("vertex_profiles").select("user_id").eq("username",username).maybeSingle();if(!target)return;
    if(action==="remove"){if(target.user_id===user.id)return;await client.from("vertex_staff_roles").delete().eq("user_id",target.user_id);return}
    if(!staffRoles.includes(role as typeof staffRoles[number]))return;
    const capabilities=capabilityText.split(",").map(x=>x.trim()).filter(Boolean).slice(0,30);
    await client.from("vertex_staff_roles").upsert({user_id:target.user_id,role,capabilities},{onConflict:"user_id"});
  }

  return <main className="page">
    <div className="section-head"><div><div className="kicker">Restricted control center</div><h1 style={{fontSize:42,letterSpacing:"-.05em",margin:"7px 0"}}>Owner Studio</h1><p className="section-copy">Games, reports, users, staff, marketplace, economy, security, logs, and platform settings.</p></div><span className="pill"><ShieldCheck size={13}/>{staff.role}</span></div>

    <div className="metric-grid">
      <div className="metric"><Users size={17}/><div className="metric-value">{games?.length??0}</div><div className="metric-label">Games loaded</div></div>
      <div className="metric"><Flag size={17}/><div className="metric-value">{reports?.filter(x=>x.status==="open").length??0}</div><div className="metric-label">Open reports</div></div>
      <div className="metric"><Gavel size={17}/><div className="metric-value">{logs?.length??0}</div><div className="metric-label">Recent audit events</div></div>
      <div className="metric"><Eye size={17}/><div className="metric-value">{games?.filter(x=>x.status==="pending_review").length??0}</div><div className="metric-label">Pending review</div></div>
    </div>

    <section className="section"><div className="section-head"><div><h2 className="section-title">Game review queue</h2><p className="section-copy">Only authorized staff can change publication state.</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>Game</th><th>State</th><th>Genre</th><th>Action</th></tr></thead><tbody>
      {games?.map(g=><tr key={g.id}><td><Link href={"/games/"+g.id}><strong>{g.title}</strong></Link></td><td><span className={"pill "+(g.status==="pending_review"?"warn":"")}>{g.status.replace("_"," ")}</span></td><td className="meta">{g.genre}</td><td><form action={reviewGame} className="stack"><input type="hidden" name="gameId" value={g.id}/>{g.status==="pending_review"&&<><button className="btn sm primary" name="status" value="published">Approve</button><button className="btn sm" name="status" value="declined">Decline</button></>}{g.status==="published"&&<button className="btn sm" name="status" value="paused">Pause</button>}</form></td></tr>)}
    </tbody></table></div></section>

    <section className="section"><div className="section-head"><div><h2 className="section-title">Reports</h2><p className="section-copy">Auditable resolution actions.</p></div></div><div className="table-wrap"><table className="table"><thead><tr><th>Type</th><th>Reason</th><th>Severity</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {reports?.map(r=><tr key={r.id}><td>{r.target_type}</td><td>{r.reason}</td><td><span className="pill">{r.severity}</span></td><td>{r.status}</td><td>{r.status==="open"&&<form action={resolveReport}><input type="hidden" name="reportId" value={r.id}/><button className="btn sm" name="status" value="resolved">Resolve</button></form>}</td></tr>)}
    </tbody></table></div></section>

    <section className="section grid grid-2">
      <div className="card pad"><h2 className="section-title">Player moderation</h2><p className="section-copy">Mute, suspend, ban, or restore a user by Vertex username.</p><form className="form" style={{marginTop:16}} action={moderateUser}>
        <div className="field"><label className="label">Username</label><input className="input" name="username" required placeholder="@username"/></div>
        <div className="grid grid-2"><div className="field"><label className="label">Status</label><select className="select" name="status" defaultValue="active">{moderationStatuses.map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label className="label">Expires</label><input className="input" type="datetime-local" name="expiresAt"/></div></div>
        <div className="field"><label className="label">Reason</label><input className="input" name="reason" maxLength={500} placeholder="Optional moderation note"/></div>
        <button className="btn primary" type="submit">Save moderation state</button>
      </form></div>

      <div className="card pad"><h2 className="section-title">Staff management</h2><p className="section-copy">Assign non-owner staff roles and capabilities.</p><form className="form" style={{marginTop:16}} action={saveStaff}>
        <div className="field"><label className="label">Username</label><input className="input" name="username" required placeholder="@username"/></div>
        <div className="field"><label className="label">Role</label><select className="select" name="role" defaultValue="moderator">{staffRoles.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="field"><label className="label">Capabilities</label><input className="input" name="capabilities" placeholder="view_reports,review_games,moderate_users"/></div>
        <div className="stack"><button className="btn primary" name="action" value="save" type="submit">Save staff role</button><button className="btn danger" name="action" value="remove" type="submit">Remove staff role</button></div>
      </form></div>
    </section>

    <section className="section grid grid-2">
      <div className="card pad"><h2 className="section-title">Current moderation states</h2>{moderation?.length?<div className="table-wrap" style={{marginTop:12}}><table className="table"><thead><tr><th>User</th><th>Status</th><th>Expires</th></tr></thead><tbody>{moderation.map(x=><tr key={x.user_id}><td>{x.user_id}</td><td>{x.status}</td><td>{x.expires_at?new Date(x.expires_at).toLocaleString():"—"}</td></tr>)}</tbody></table></div>:<p className="meta" style={{marginTop:12}}>No moderation states yet.</p>}</div>
      <div className="card pad"><h2 className="section-title">Staff roster</h2>{staffRows?.length?<div className="table-wrap" style={{marginTop:12}}><table className="table"><thead><tr><th>User</th><th>Role</th><th>Capabilities</th></tr></thead><tbody>{staffRows.map(x=><tr key={x.user_id}><td>{x.user_id}</td><td>{x.role}</td><td className="meta">{x.capabilities?.join(", ")||"—"}</td></tr>)}</tbody></table></div>:<p className="meta" style={{marginTop:12}}>No additional staff accounts.</p>}</div>
    </section>
  </main>;
}
