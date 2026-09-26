(()=>{"use strict";
const SB_URL="https://zqvntzvugfbvdwkoxfbm.supabase.co";
const SB_KEY="sb_publishable_hXc8J0cDIXTKJn5eQVJQrw_jsyYJjYy";
const db=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const status=(m,good=false)=>{const e=$("#status");e.textContent=m;e.className="status "+(good?"good":"bad")};
let U=null;

async function boot(){
  const s=await db.auth.getSession();U=s.data.session?.user||null;
  if(!U)return location.href="./signin.html";
  const role=await db.rpc("vertex_my_staff_role");
  if(role.data?.[0]?.role!=="owner")return status("Owner access required.");
  await loadUsers();
}

function rows(users){
  if(!users.length)return "<div class='panel'>No accounts found.</div>";
  return users.map(u=>"<div class='owner-row' style='display:grid;grid-template-columns:minmax(0,1.4fr) auto auto;gap:12px;align-items:center;padding:12px;border:1px solid #262932;border-radius:9px;background:#0f1015;margin-top:8px'>"+
    "<div class='owner-user' style='display:flex;gap:10px;align-items:center'>"+(u.avatar_url?"<img class='pfp' style='width:42px;height:42px;border-radius:8px' src='"+esc(u.avatar_url)+"' alt=''>":"<div class='pfp fallback' style='width:42px;height:42px;border-radius:8px'>V</div>")+"<div><b>"+esc(u.display_name||"Vertex Player")+"</b><div class='handle'>@"+esc(u.username||"player")+" · "+esc(u.email||"")+"</div></div></div>"+
    "<div><span class='btn' style='cursor:default'>"+esc(u.moderation_status||"active")+"</span> <span class='btn' style='cursor:default'>"+esc(u.staff_role||"player")+"</span><div style='color:#c8b8ff;font-size:12px;margin-top:6px'>◆ "+Number(u.balance||0).toLocaleString()+" coins</div></div>"+
    "<div class='actions'><button class='btn' data-act='moderate' data-id='"+esc(u.user_id)+"'>Moderate</button><button class='btn' data-act='coins' data-id='"+esc(u.user_id)+"'>Coins</button><button class='btn' data-act='role' data-id='"+esc(u.user_id)+"'>Role</button></div></div>"
  ).join("");
}

async function loadUsers(){
  const q=$("#search").value.trim()||null;
  const r=await db.rpc("vertex_owner_list_users",{p_search:q,p_limit:100});
  if(r.error)return status(r.error.message);
  $("#users").innerHTML=rows(r.data||[]);
  document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>act(b.dataset.act,b.dataset.id));
}

async function act(type,id){
  if(type==="moderate"){
    const value=(prompt("Status: active, suspended, or banned","active")||"").toLowerCase().trim();
    if(!["active","suspended","banned"].includes(value))return status("Invalid moderation status.");
    const reason=prompt("Reason","Owner action")||"";
    const r=await db.rpc("vertex_owner_set_user_moderation",{p_target:id,p_status:value,p_reason:reason,p_note:"Owner Console"});
    if(r.error)return status(r.error.message);status("Moderation updated.",true);return loadUsers();
  }
  if(type==="coins"){
    const raw=prompt("Coin adjustment. Negative removes coins.","100");if(raw===null)return;
    const delta=Number(raw);if(!Number.isInteger(delta)||delta===0)return status("Enter a non-zero whole number.");
    const reason=prompt("Reason","Owner adjustment")||"Owner adjustment";
    const r=await db.rpc("vertex_owner_adjust_currency",{p_target:id,p_delta:delta,p_reason:reason});
    if(r.error)return status(r.error.message);status("Currency updated.",true);return loadUsers();
  }
  if(type==="role"){
    const value=(prompt("Role: staff, moderator, or admin","staff")||"").toLowerCase().trim();
    if(!["staff","moderator","admin"].includes(value))return status("Invalid role.");
    const r=await db.rpc("vertex_owner_set_staff_role",{p_target:id,p_role:value,p_capabilities:[]});
    if(r.error)return status(r.error.message);status("Staff role updated.",true);return loadUsers();
  }
}

$("#refresh").onclick=loadUsers;
$("#search").onkeydown=e=>{if(e.key==="Enter")loadUsers()};
addEventListener("load",boot);
})();