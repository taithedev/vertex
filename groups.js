(()=>{"use strict";
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=v=>Number(v||0).toLocaleString();
const db=()=>window.__vertexDb;
const me=()=>window.__vertexGroupsUser||null;
async function currentUser(){
  const s=await db().auth.getSession(); window.__vertexGroupsUser=s.data.session?.user||null; return window.__vertexGroupsUser;
}
function card(g){return '<article class="group-card" data-group="'+g.id+'"><div class="group-banner" style="'+(g.banner_url?'background-image:url('+JSON.stringify(g.banner_url)+')':'')+'"><div class="group-icon-wrap">'+(g.icon_url?'<img class="group-icon" src="'+esc(g.icon_url)+'" alt="">':'<div class="group-icon fallback">V</div>')+'</div></div><div class="group-card-body"><h3>'+esc(g.name)+'</h3><p>'+esc(g.description||"No description yet.")+'</p><div class="group-meta"><span>'+fmt(g.member_count)+' members</span><span>'+esc(g.visibility)+'</span></div></div></article>'}
async function discovery(){
  const u=await currentUser();
  const q=(document.querySelector("#groups-search")?.value||"").trim();
  let query=db().from("vertex_groups").select("id,name,slug,description,icon_url,banner_url,visibility,member_count,post_count,owner_id,created_at").order("member_count",{ascending:false}).limit(48);
  if(q)query=query.or("name.ilike.%"+q.replace(/[%_,]/g,"")+"%,description.ilike.%"+q.replace(/[%_,]/g,"")+"%");
  const r=await query;if(r.error)return '<div class="panel empty">Unable to load groups: '+esc(r.error.message)+'</div>';
  const groups=r.data||[];
  let joined=[];
  if(u){
    const m=await db().from("vertex_group_members").select("group_id").eq("user_id",u.id).eq("banned",false);
    if(!m.error&&m.data?.length){const ids=m.data.map(x=>x.group_id);const j=await db().from("vertex_groups").select("id,name,slug,description,icon_url,banner_url,visibility,member_count,post_count,owner_id,created_at").in("id",ids).order("updated_at",{ascending:false}).limit(8);joined=j.data||[]}
  }
  return '<div class="section"><div><div class="eyebrow">Community</div><h2>Groups</h2><p class="page-sub">Find communities, join conversations, and build your own group for 100 Vertex Coins.</p></div>'+(u?'<button class="btn primary" id="create-group">Create group · 100 Coins</button>':'<button class="btn primary" data-r="home">Sign in to create</button>')+'</div>'+
  '<div class="group-discovery-tools"><input class="input" id="groups-search" value="'+esc(q)+'" placeholder="Search groups..."><button class="btn" id="groups-search-btn">Search</button></div>'+
  (joined.length?'<section class="group-section"><div class="section"><div><div class="eyebrow">Your communities</div><h3>Joined groups</h3></div></div><div class="group-grid">'+joined.map(card).join("")+'</div></section>':'')+
  '<section class="group-section"><div class="section"><div><div class="eyebrow">Discover</div><h3>'+(q?'Search results':'Popular groups')+'</h3></div></div><div class="group-grid">'+(groups.length?groups.map(card).join(""):'<div class="panel empty">No groups found.</div>')+'</div></section>';
}
async function groupData(id){
  const g=await db().from("vertex_groups").select("*").eq("id",id).maybeSingle();
  if(g.error||!g.data)return {error:g.error?.message||"Group not found."};
  const members=await db().from("vertex_group_members").select("group_id,user_id,role,permissions,banned,ban_reason,joined_at").eq("group_id",id).order("joined_at",{ascending:true}).limit(100);
  const posts=await db().from("vertex_group_posts").select("id,group_id,author_id,body,is_pinned,is_announcement,created_at,updated_at").eq("group_id",id).order("is_pinned",{ascending:false}).order("created_at",{ascending:false}).limit(50);
  const u=await currentUser(); let profiles=[];
  const ids=[...(members.data||[]).map(x=>x.user_id),...(posts.data||[]).map(x=>x.author_id)].filter(Boolean);
  if(ids.length){const p=await db().from("vertex_profiles").select("user_id,username,display_name,avatar_url").in("user_id",[...new Set(ids)]);profiles=p.data||[]}
  const profileBy=new Map(profiles.map(p=>[p.user_id,p]));
  const mine=(members.data||[]).find(m=>m.user_id===u?.id);
  return {g:g.data,members:members.data||[],posts:posts.data||[],profileBy,mine,u};
}
function profile(p){return '<div class="group-author">'+(p?.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="">':'<div class="group-author-fallback">V</div>')+'<div><b>'+esc(p?.display_name||"Vertex Player")+'</b><small>@'+esc(p?.username||"player")+'</small></div></div>'}
function postHtml(p,d){
  const pr=d.profileBy.get(p.author_id),mine=d.mine;
  const controls=(mine&&(mine.role==='owner'||mine.role==='admin'||mine.role==='moderator')?'<button class="btn sm" data-pin="'+p.id+'">'+(p.is_pinned?'Unpin':'Pin')+'</button>':'')+
    (p.author_id===d.u?.id||mine&&(mine.role==='owner'||mine.role==='admin'||mine.role==='moderator')?'<button class="btn sm danger" data-delete-post="'+p.id+'">Delete</button>':'');
  return '<article class="group-post '+(p.is_pinned?'pinned':'')+'">'+(p.is_announcement?'<div class="group-announcement">Announcement</div>':'')+'<div class="group-post-head">'+profile(pr)+'<time>'+new Date(p.created_at).toLocaleString()+'</time></div><div class="group-post-body">'+esc(p.body).replace(/\n/g,"<br>")+'</div><div class="group-post-actions"><button class="btn sm" data-like-post="'+p.id+'">Like</button><button class="btn sm" data-comment-post="'+p.id+'">Comment</button>'+controls+'</div></article>'
}
async function page(id){
  const d=await groupData(id); if(d.error)return '<div class="panel empty">'+esc(d.error)+'</div>';
  const g=d.g,mine=d.mine,active=d.u&&mine&&!mine.banned;
  const canManage=mine&&(mine.role==='owner'||mine.role==='admin'||mine.role==='moderator');
  return '<div class="group-page"><div class="group-hero" style="'+(g.banner_url?'background-image:url('+JSON.stringify(g.banner_url)+')':'')+'"><div class="group-hero-overlay"><div class="group-icon-large">'+(g.icon_url?'<img src="'+esc(g.icon_url)+'" alt="">':'V')+'</div><div><div class="eyebrow">Vertex Group</div><h1>'+esc(g.name)+'</h1><p>'+esc(g.description||"")+'</p><div class="group-hero-meta"><span>'+fmt(g.member_count)+' members</span><span>'+esc(g.visibility)+' group</span></div></div></div></div>'+
  '<div class="group-nav"><button class="btn active" data-group-tab="home">Home</button><button class="btn" data-group-tab="posts">Posts</button><button class="btn" data-group-tab="members">Members</button><button class="btn" data-group-tab="about">About</button>'+(canManage?'<button class="btn" data-group-tab="settings">Settings</button>':'')+'<span class="group-nav-spacer"></span>'+(active?'<button class="btn" id="leave-group">Leave</button>':g.visibility==='public'&&d.u?'<button class="btn primary" id="join-group">Join group</button>':!d.u?'<button class="btn primary" data-r="home">Sign in</button>':'')+'</div>'+
  '<div id="group-content">'+(active||g.visibility==='public'?renderHome(d):'<div class="panel empty">This is a private group. Join the group to view its posts.</div>')+'</div></div>';
}
function renderHome(d){
  const canPost=!!d.mine&&!d.mine.banned, canAnnounce=d.mine&&(d.mine.role==='owner'||d.mine.role==='admin'||(d.mine.role==='moderator'&&d.mine.permissions?.manage_announcements));
  return (canPost?'<div class="panel group-composer"><textarea class="area" id="group-post-body" maxlength="5000" placeholder="Share something with the group..."></textarea><div class="composer-row">'+(canAnnounce?'<label class="check"><input id="group-announcement" type="checkbox"> Announcement</label>':'')+'<button class="btn primary" id="group-post-submit">Post</button></div></div>':'')+'<div class="group-post-list">'+(d.posts.length?d.posts.map(p=>postHtml(p,d)).join(""):'<div class="panel empty">No posts yet. Be the first to start the conversation.</div>')+'</div>';
}
async function membersView(d){
  return '<div class="panel"><div class="section"><div><div class="eyebrow">Community</div><h3>Members</h3></div><span class="chip">'+fmt(d.g.member_count)+' members</span></div><div class="group-member-list">'+d.members.map(m=>{const p=d.profileBy.get(m.user_id),manage=d.mine&&(d.mine.role==='owner'||d.mine.role==='admin'||d.mine.role==='moderator')&&m.user_id!==d.u?.id&&m.role!=='owner';return '<div class="group-member-row">'+profile(p)+'<span class="group-role">'+esc(m.banned?'banned':m.role)+'</span>'+(manage?'<div class="member-actions">'+(m.banned?'<button class="btn sm" data-unban="'+m.user_id+'">Unban</button>':'<button class="btn sm" data-remove-member="'+m.user_id+'">Remove</button><button class="btn sm danger" data-ban-member="'+m.user_id+'">Ban</button>')+(d.mine.role==='owner'?'<select class="select member-role" data-role-user="'+m.user_id+'"><option '+(m.role==='member'?'selected':'')+' value="member">Member</option><option '+(m.role==='moderator'?'selected':'')+' value="moderator">Moderator</option><option '+(m.role==='admin'?'selected':'')+' value="admin">Admin</option></select>'+(m.role==='admin'||m.role==='moderator'?'<details class="perm-editor"><summary>Permissions</summary>'+['manage_members','manage_posts','manage_settings','manage_announcements'].map(k=>'<label><input type="checkbox" data-perm-user="'+m.user_id+'" data-perm-key="'+k+'" '+(m.permissions?.[k]?'checked':'')+'>'+k.replaceAll('_',' ')+'</label>').join('')+'</details>':''):'')+'</div>':'')+'</div>'}).join("")+'</div></div>';
}
async function aboutView(d){return '<div class="cols"><div class="panel"><div class="eyebrow">About</div><h3>'+esc(d.g.name)+'</h3><p class="long-copy">'+esc(d.g.description||"No description yet.")+'</p><div class="stats"><div class="stat"><b>'+fmt(d.g.member_count)+'</b><small>Members</small></div><div class="stat"><b>'+fmt(d.g.post_count)+'</b><small>Posts</small></div><div class="stat"><b>'+new Date(d.g.created_at).toLocaleDateString()+'</b><small>Created</small></div><div class="stat"><b>'+esc(d.g.visibility)+'</b><small>Visibility</small></div></div></div><div class="panel"><div class="eyebrow">Owner</div>'+profile(d.profileBy.get(d.g.owner_id))+'</div></div>'}
async function settingsView(d){
  const m=d.mine; if(!m||m.role==='member')return '<div class="panel empty">You do not have permission to manage this group.</div>';
  return '<div class="cols"><div class="panel"><div class="eyebrow">Branding</div><h3>Group settings</h3><div class="form"><label>Name<input class="input" id="group-name" maxlength="40" value="'+esc(d.g.name)+'"></label><label>Description<textarea class="area" id="group-description" maxlength="1000">'+esc(d.g.description)+'</textarea></label><label>Visibility<select class="select" id="group-visibility"><option value="public" '+(d.g.visibility==='public'?'selected':'')+'>Public</option><option value="private" '+(d.g.visibility==='private'?'selected':'')+'>Private</option></select></label><label>Icon URL<input class="input" id="group-icon-url" value="'+esc(d.g.icon_url||'')+'"></label><label>Banner URL<input class="input" id="group-banner-url" value="'+esc(d.g.banner_url||'')+'"></label><button class="btn primary" id="save-group-settings">Save settings</button></div></div><div class="panel"><div class="eyebrow">Ownership</div><p class="long-copy">Transfer ownership to an active member or delete the group permanently. Group creation costs are not refunded.</p><div class="form"><select class="select" id="transfer-target"><option value="">Select member...</option>'+d.members.filter(x=>x.user_id!==d.u?.id&&!x.banned).map(x=>'<option value="'+x.user_id+'">'+esc(d.profileBy.get(x.user_id)?.display_name||x.user_id)+'</option>').join("")+'</select><button class="btn" id="transfer-owner">Transfer ownership</button><button class="btn danger" id="delete-group">Delete group</button></div></div></div>';
}
async function refresh(id){window.location.hash="group/"+id}
function bind(){
  document.querySelectorAll("[data-group]").forEach(e=>e.onclick=()=>refresh(e.dataset.group));
  document.querySelector("#create-group")?.addEventListener("click",openCreate);
  document.querySelector("#groups-search-btn")?.addEventListener("click",()=>discovery().then(v=>{document.querySelector("#view").innerHTML=v;bind()}));
  document.querySelector("#groups-search")?.addEventListener("keydown",e=>{if(e.key==="Enter")document.querySelector("#groups-search-btn")?.click()});
  document.querySelector("#join-group")?.addEventListener("click",async()=>{await action("vertex_join_group",{p_group:currentId()}, "Joined group.")});
  document.querySelector("#leave-group")?.addEventListener("click",async()=>{if(confirm("Leave this group?"))await action("vertex_leave_group",{p_group:currentId()},"Left group.")});
  document.querySelectorAll("[data-group-tab]").forEach(b=>b.onclick=async()=>{const d=await groupData(currentId());document.querySelectorAll("[data-group-tab]").forEach(x=>x.classList.toggle("active",x===b));const c=document.querySelector("#group-content");if(b.dataset.groupTab==="home"||b.dataset.groupTab==="posts")c.innerHTML=renderHome(d);else if(b.dataset.groupTab==="members")c.innerHTML=await membersView(d);else if(b.dataset.groupTab==="about")c.innerHTML=await aboutView(d);else c.innerHTML=await settingsView(d);bindInner(d)});
  bindInner();
}
function currentId(){return location.hash.split("/")[1]}
function bindInner(d){
  document.querySelector("#group-post-submit")?.addEventListener("click",async()=>{const body=document.querySelector("#group-post-body").value.trim(),ann=!!document.querySelector("#group-announcement")?.checked;if(!body)return window.vertexToast?.("Write something first.",false);await action("vertex_create_group_post",{p_group:currentId(),p_body:body,p_announcement:ann},"Post published.")});
  document.querySelectorAll("[data-delete-post]").forEach(b=>b.onclick=async()=>{if(confirm("Delete this post?"))await action("vertex_delete_group_post",{p_group:currentId(),p_post:b.dataset.deletePost},"Post deleted.")});
  document.querySelectorAll("[data-pin]").forEach(b=>b.onclick=async()=>await action("vertex_pin_group_post",{p_group:currentId(),p_post:b.dataset.pin,p_pinned:b.textContent.trim()==="Pin"},"Post updated."));
  document.querySelectorAll("[data-like-post]").forEach(b=>b.onclick=async()=>await action("vertex_group_toggle_post_like",{p_post:b.dataset.likePost},"Reaction updated."));
  document.querySelectorAll("[data-comment-post]").forEach(b=>b.onclick=async()=>{const body=prompt("Comment");if(body)await action("vertex_group_add_comment",{p_post:b.dataset.commentPost,p_body:body},"Comment added.")});
  document.querySelectorAll("[data-remove-member]").forEach(b=>b.onclick=async()=>{if(confirm("Remove this member?"))await action("vertex_remove_group_member",{p_group:currentId(),p_target:b.dataset.removeMember,p_ban:false},"Member removed.")});
  document.querySelectorAll("[data-ban-member]").forEach(b=>b.onclick=async()=>{const reason=prompt("Ban reason","Group moderation");if(reason!==null)await action("vertex_remove_group_member",{p_group:currentId(),p_target:b.dataset.banMember,p_ban:true,p_reason:reason},"Member banned.")});
  document.querySelectorAll("[data-unban]").forEach(b=>b.onclick=async()=>await action("vertex_unban_group_member",{p_group:currentId(),p_target:b.dataset.unban},"Member unbanned."));
  document.querySelectorAll("[data-role-user]").forEach(s=>s.onchange=async()=>await action("vertex_set_group_role",{p_group:currentId(),p_target:s.dataset.roleUser,p_role:s.value},"Role updated."));document.querySelectorAll("[data-perm-user]").forEach(x=>x.onchange=async()=>{const d=await groupData(currentId());const m=d.members.find(v=>v.user_id===x.dataset.permUser);const permissions={...(m?.permissions||{})};permissions[x.dataset.permKey]=x.checked;await action("vertex_set_group_permissions",{p_group:currentId(),p_target:x.dataset.permUser,p_permissions:permissions},"Permissions updated.");});
  document.querySelector("#save-group-settings")?.addEventListener("click",async()=>await action("vertex_update_group",{p_group:currentId(),p_name:document.querySelector("#group-name").value,p_description:document.querySelector("#group-description").value,p_visibility:document.querySelector("#group-visibility").value,p_icon_url:document.querySelector("#group-icon-url").value||null,p_banner_url:document.querySelector("#group-banner-url").value||null},"Group settings saved."));
  document.querySelector("#transfer-owner")?.addEventListener("click",async()=>{const id=document.querySelector("#transfer-target").value;if(id&&confirm("Transfer ownership?"))await action("vertex_transfer_group_owner",{p_group:currentId(),p_target:id},"Ownership transferred.")});
  document.querySelector("#delete-group")?.addEventListener("click",async()=>{if(confirm("Permanently delete this group?"))await action("vertex_delete_group",{p_group:currentId()},"Group deleted.",()=>location.hash="groups")});
}
async function action(fn,args,msg,done){
  const r=await db().rpc(fn,args); if(r.error){window.vertexToast?.(r.error.message||"Operation failed.",false);return}
  window.vertexToast?.(msg,true); if(done){done();return} await refresh(currentId());
}
function openCreate(){
  const modal=document.querySelector("#modal"); if(!modal)return;
  modal.innerHTML='<div class="modalbg"><div class="modal"><div class="modalhead"><div><div class="eyebrow">Community</div><h2>Create a group</h2><p class="page-sub">Creating a group costs exactly 100 Vertex Coins.</p></div><button class="close" id="group-create-close">×</button></div><div class="form"><label>Name<input class="input" id="new-group-name" maxlength="40" placeholder="Your group name"></label><label>Description<textarea class="area" id="new-group-description" maxlength="1000" placeholder="What is your group about?"></textarea></label><label>Visibility<select class="select" id="new-group-visibility"><option value="public">Public</option><option value="private">Private</option></select></label><button class="btn primary" id="group-create-submit">Create for 100 Coins</button></div></div></div>';
  document.querySelector("#group-create-close").onclick=()=>modal.innerHTML="";
  document.querySelector("#group-create-submit").onclick=async()=>{
    const name=document.querySelector("#new-group-name").value.trim(),description=document.querySelector("#new-group-description").value.trim(),visibility=document.querySelector("#new-group-visibility").value;
    if(!name)return window.vertexToast?.("Enter a group name.",false);
    const r=await db().rpc("vertex_create_group",{p_name:name,p_description:description,p_visibility:visibility,p_icon_url:null,p_banner_url:null});
    if(r.error){window.vertexToast?.(r.error.message||"Group creation failed.",false);return}
    modal.innerHTML=""; window.vertexToast?.("Group created for 100 Coins.",true); await window.__vertexReload?.(); location.hash="group/"+r.data;
  };
}
window.VertexGroups={discovery,page,bind,groupData};
})();