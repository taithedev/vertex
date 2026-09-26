(()=>{"use strict";
const SB_URL="https://zqvntzvugfbvdwkoxfbm.supabase.co";
const SB_KEY="sb_publishable_hXc8J0cDIXTKJn5eQVJQrw_jsyYJjYy";
const db=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const S={u:null,p:null,g:[],currency:0,avatar:{},staff:null,r:location.hash.slice(1)||"home",q:""};
const $=(s,r=document)=>r.querySelector(s);
const esc=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=x=>Intl.NumberFormat(undefined,{notation:Number(x)>999?"compact":"standard",maximumFractionDigits:1}).format(Number(x||0));
const toast=(m,good=true)=>{const d=document.createElement("div");d.className="toast "+(good?"good":"bad");d.textContent=m;$("#toast").append(d);setTimeout(()=>d.remove(),3000)};
const go=r=>{location.hash=r};
const currentGame=()=>S.g.find(g=>g.id===S.r.split("/")[1]);

async function load(){
 const session=await db.auth.getSession();
 S.u=session.data.session?.user||null;
 S.p=null;S.avatar={};S.staff=null;S.currency=0;
 if(S.u){
   const [p,c,a,role]=await Promise.all([
     db.from("vertex_profiles").select("*").eq("user_id",S.u.id).maybeSingle(),
     db.from("vertex_currency_accounts").select("balance").eq("user_id",S.u.id).maybeSingle(),
     db.from("vertex_avatar_looks").select("config").eq("user_id",S.u.id).maybeSingle(),
     db.rpc("vertex_my_staff_role")
   ]);
   S.p=p.data||null;S.avatar=a.data?.config||{};S.staff=role.data?.[0]||null;S.currency=Number(c.data?.balance||0);
 }
 let q=db.from("vertex_games").select("id,creator_id,title,description,genre,status,age_rating,thumbnail_url,likes_count,favorites_count,visits_count,current_version,published_at").eq("status","published").order("published_at",{ascending:false}).limit(80);
 if(S.q)q=q.ilike("title","%"+S.q.replace(/[%_]/g,"")+"%");
 const games=await q;S.g=games.data||[];await render();
 if(S.u&&S.p&&!S.p.birth_date)profileAgeGate();
}
function nav(){
 document.querySelectorAll(".main-nav button").forEach(b=>b.classList.toggle("active",b.dataset.r===S.r.split("/")[0]));
 const owner=!!S.u&&S.staff?.role==="owner";
 if($("#owner-nav"))$("#owner-nav").style.display=owner?"flex":"none";
 $("#account").innerHTML=S.u?'<button class="account" data-r="settings">'+(S.p?.avatar_url?'<img class="account-avatar" src="'+esc(S.p.avatar_url)+'" alt="">':'<span class="account-avatar fallback">V</span>')+'<span class="account-copy"><b>'+esc(S.p?.display_name||"Vertex Player")+'</b><small>@'+esc(S.p?.username||"player")+'</small><small class="account-balance">◆ '+fmt(S.currency)+' Vertex Coins</small>'+(owner?'<small class="account-role">Owner</small>':'')+'</span></button>':'<button class="btn primary" style="width:100%" id="side-login">Sign in</button>';
 $("#top-profile").textContent=S.u?(S.p?.display_name||"Account"):"Sign in";$("#currency-balance").textContent=fmt(S.currency);
}
function cards(list=S.g){return list.length?'<div class="grid">'+list.map(g=>'<article class="card" data-game="'+g.id+'"><div class="cover" '+(g.thumbnail_url?'style="background-image:url('+JSON.stringify(g.thumbnail_url)+')"':'')+'><span class="tag">'+esc(g.genre||"Experience")+'</span></div><div class="body"><div class="title">'+esc(g.title)+'</div><div class="meta"><span>'+fmt(g.visits_count)+' visits</span><span>♡ '+fmt(g.likes_count)+'</span></div></div></article>').join("")+'</div>':'<div class="panel empty">No published experiences found.</div>'}
function home(){return '<div class="hero"><div><div class="eyebrow">Welcome to Vertex</div><h1>Play what you love.<br><span style="color:var(--accent2)">Find your people.</span></h1><p>Discover community-made experiences, meet friends and explore a growing player-first universe built on Vertex.</p><div class="hero-actions"><button class="btn primary" data-r="games">Explore experiences</button><button class="btn" data-r="studio">Open Studio</button></div></div><div class="hero-card"><span style="color:var(--muted)">Live catalog</span><div class="big">'+fmt(S.g.length)+'</div><span style="color:var(--muted)">published experiences</span><hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><span class="age-badge">12+</span><p style="font-size:12px;margin:10px 0 0">Vertex is designed around a 12+ community standard.</p></div></div><div class="section"><div><div class="eyebrow">Explore</div><h2>Featured experiences</h2></div><button class="btn" data-r="games">See all</button></div>'+cards()}
function games(){return '<div class="section"><div><div class="eyebrow">Catalog</div><h2>Experiences</h2></div><button class="btn primary" data-r="studio">Studio</button></div>'+cards()}
function discover(){return '<div class="section"><div><div class="eyebrow">Discover</div><h2>Find your next experience</h2></div></div><div class="panel"><input class="input" id="discover-q" value="'+esc(S.q)+'" placeholder="Search games and experiences..."></div><div style="height:15px"></div>'+cards()}
function friends(){return '<div class="section"><div><div class="eyebrow">Social</div><h2>Friends</h2></div></div><div class="panel empty">'+(S.u?"Your friend list will appear here as social connections are added.":"Sign in to connect with friends.")+'</div>'}
function avatar(){
 if(!S.u)return '<div class="panel empty"><div><h2>Sign in to use Avatar</h2><p>Sign in to save your own avatar look.</p><button class="btn primary" id="settings-login">Sign in</button></div></div>';
 const c=S.avatar||{},opts=[["head","Head",["classic","square"]],["hair","Hair",["none","short","spiky"]],["shirt","Shirt",["plain","hoodie","jacket"]],["pants","Pants",["plain","jeans"]],["accessory","Accessory",["none","cap","glasses"]],["accent","Accent",["violet","blue","pink"]]];
 return '<div class="section"><div><div class="eyebrow">Identity</div><h2>Avatar</h2></div><span class="chip">Saved look</span></div><div class="avatar-layout"><div class="panel avatar-preview-panel"><div id="avatar-preview" class="roblox-avatar '+esc(c.accent||"violet")+'"><div class="av-head '+esc(c.head||"classic")+'"><div class="av-face"><i></i><i></i></div></div><div class="av-hair '+esc(c.hair||"short")+'"></div><div class="av-body '+esc(c.shirt||"plain")+'"></div><div class="av-legs '+esc(c.pants||"plain")+'"><span></span><span></span></div><div class="av-accessory '+esc(c.accessory||"none")+'"></div></div><h3 style="margin-bottom:4px">Your saved avatar</h3><p style="color:var(--muted);line-height:1.5">A clean block-style player avatar that can grow as Vertex adds real catalog wearables.</p></div><div class="panel"><div class="eyebrow">Customize</div><h3>Appearance slots</h3><div class="avatar-controls">'+opts.map(([key,label,values])=>'<label>'+label+'<select class="input avatar-select" data-avatar-key="'+key+'">'+values.map(v=>'<option value="'+v+'" '+(c[key]===v?"selected":"")+'>'+v.charAt(0).toUpperCase()+v.slice(1)+'</option>').join("")+'</select></label>').join("")+'</div><button class="btn primary" id="avatar-save">Save avatar</button></div></div>';
}
function groups(){return '<div class="section"><div><div class="eyebrow">Community</div><h2>Groups</h2></div></div><div class="panel empty">Groups are ready for the Vertex community layer. No fake groups are displayed.</div>'}
function studio(){return '<div class="section"><div><div class="eyebrow">Creator</div><h2>Studio</h2></div></div><div class="stats"><div class="stat"><b>'+S.g.filter(g=>g.creator_id===S.u?.id).length+'</b><small>Your published experiences</small></div><div class="stat"><b>Live</b><small>Publishing pipeline</small></div><div class="stat"><b>Ready</b><small>Browser runtime</small></div><div class="stat"><b>12+</b><small>Community standard</small></div></div><div class="cols" style="margin-top:17px"><div class="panel"><h3>Creator dashboard</h3><p style="color:var(--muted)">Analytics, asset storage and publishing systems remain connected to the existing Vertex backend.</p><button class="btn" data-r="analytics">Analytics</button><button class="btn" data-r="assets">Asset Vault</button></div><div class="panel"><h3>Creation scope</h3><p style="color:var(--muted)">Scene editing, script editing and the larger new-game creation expansion remain paused as requested.</p></div></div>'}
async function analytics(){if(!S.u)return '<div class="panel empty">Sign in to view analytics.</div>';const g=S.g.filter(x=>x.creator_id===S.u.id),v=g.reduce((a,x)=>a+Number(x.visits_count||0),0),l=g.reduce((a,x)=>a+Number(x.likes_count||0),0),f=g.reduce((a,x)=>a+Number(x.favorites_count||0),0);return '<div class="section"><div><div class="eyebrow">Creator data</div><h2>Analytics</h2></div></div><div class="stats"><div class="stat"><b>'+g.length+'</b><small>Published</small></div><div class="stat"><b>'+fmt(v)+'</b><small>Visits</small></div><div class="stat"><b>'+fmt(l)+'</b><small>Likes</small></div><div class="stat"><b>'+fmt(f)+'</b><small>Favorites</small></div></div><div class="panel" style="margin-top:17px"><table style="width:100%;border-collapse:collapse"><tr><th align="left">Experience</th><th>Visits</th><th>Likes</th></tr>'+g.map(x=>'<tr><td style="padding:10px 0">'+esc(x.title)+'</td><td align="center">'+fmt(x.visits_count)+'</td><td align="center">'+fmt(x.likes_count)+'</td></tr>').join("")+'</table></div>'}
function simple(title,sub,body){return '<div class="section"><div><div class="eyebrow">'+title+'</div><h2>'+sub+'</h2></div></div><div class="panel">'+body+'</div>'}
function settings(){
 if(!S.u)return '<div class="panel empty"><div><h2>Sign in to open Settings</h2><p>Manage your Vertex account, profile, avatar, currency and support from one place.</p><button class="btn primary" id="settings-login">Sign in</button></div></div>';
 const p=S.p||{},avatar=p.avatar_url||"",social=[["Website","website_url"],["YouTube","youtube_url"],["TikTok","tiktok_url"],["Instagram","instagram_url"],["X","x_url"],["Discord","discord_url"]];
 return '<div class="section"><div><div class="eyebrow">Account</div><h2>Settings</h2></div><span class="chip">'+(S.staff?.role?esc(S.staff.role.toUpperCase()):"PLAYER")+'</span></div>'+
 '<div class="profile-banner"><div class="profile-head">'+(avatar?'<img class="profile-pfp" src="'+esc(avatar)+'" alt="">':'<div class="profile-pfp fallback">V</div>')+'<div><h2 style="margin:0">'+esc(p.display_name||"Vertex Player")+'</h2><div class="profile-handle">@'+esc(p.username||"player")+'</div><p class="profile-bio">'+esc(p.bio||"Add a bio to tell people about yourself.")+'</p></div></div></div>'+
 '<div class="stats"><div class="stat"><b>'+fmt(S.currency)+'</b><small>Vertex Coins</small></div><div class="stat"><b>100</b><small>Welcome grant</small></div><div class="stat"><b>25</b><small>Daily reward</small></div><div class="stat"><b>12+</b><small>Platform age</small></div></div>'+
 '<div class="cols" style="margin-top:15px"><div class="panel"><h3>Profile & socials</h3><div class="form"><label>Display name<input class="input" id="dn" maxlength="40" value="'+esc(p.display_name||"")+'"></label><label>Username<input class="input" id="un" maxlength="24" value="'+esc(p.username||"")+'"></label><label>Bio<textarea class="area" id="bio" maxlength="280" placeholder="Tell the community about yourself…">'+esc(p.bio||"")+'</textarea></label><label>Date of birth<input class="input" id="dob" type="date" value="'+esc(p.birth_date||"")+'"></label><div class="social-grid">'+social.map(([label,key])=>'<label>'+label+'<input class="input" id="social-'+key+'" maxlength="300" placeholder="https://…" value="'+esc(p[key]||"")+'"></label>').join("")+'</div><button class="btn primary" id="save">Save profile</button></div></div>'+
 '<div class="panel"><h3>Profile picture</h3><div class="pfp-editor">'+(avatar?'<img class="pfp-large" src="'+esc(avatar)+'" alt="">':'<div class="pfp-large fallback">V</div>')+'<div><p style="color:var(--muted);line-height:1.5">Upload a square JPG, PNG, GIF or WebP. Maximum 2 MB.</p><input id="avatar-file" class="input" type="file" accept="image/jpeg,image/png,image/gif,image/webp"></div></div><div style="margin-top:12px"><button class="btn primary" id="upload-avatar">Upload picture</button></div></div></div>'+
 '<div class="cols" style="margin-top:15px"><div class="panel"><h3>Avatar</h3><p style="color:var(--muted);line-height:1.6">Build and save a simple player avatar with wearable slots. Your saved look appears on your Avatar page.</p><button class="btn primary" data-r="avatar">Customize avatar</button></div><div class="panel"><h3>Vertex Coins</h3><p style="color:var(--muted);line-height:1.6">Use Vertex Coins for supported Marketplace items. New accounts start with 100 coins, and the daily reward adds 25 once every 24 hours.</p><button class="btn primary" id="daily-reward">Claim 25 coins</button><button class="btn" data-r="marketplace">Open Marketplace</button></div></div>'+
 '<div class="cols" style="margin-top:15px"><div class="panel"><h3>Security</h3><p style="color:var(--muted)">'+esc(S.u.email||"")+'</p><button class="btn" id="reset-password">Change password</button><button class="btn danger" id="logout">Sign out</button></div><div class="panel support-shell"><div class="support-head"><div><div class="support-title">Vertex Support</div><div class="support-sub">Ask about accounts, Google sign-in, games, Studio, currency, settings, browser play and other Vertex features.</div></div><span class="chip">Groq</span></div><button class="btn primary" id="open-support">Open support chat</button></div></div>'+
 (S.staff?.role==="owner"?'<div class="panel owner-callout" style="margin-top:15px"><div><div class="eyebrow">Owner</div><h3 style="margin:0 0 6px">Owner Console</h3><p style="margin:0;color:var(--muted)">Manage player accounts, moderation, staff roles, currency adjustments and owner audit actions.</p></div><button class="btn primary" data-r="owner">Open Owner Console</button></div>':"");
}
function detail(g){if(!g)return '<div class="panel empty">Experience not found.</div>';return '<div class="section"><button class="btn" data-r="games">← Back</button></div><div class="cols"><div><div class="cover" style="aspect-ratio:16/8;border-radius:20px;'+(g.thumbnail_url?'background-image:url('+JSON.stringify(g.thumbnail_url)+')':'')+'"><span class="tag">'+esc(g.age_rating||"Everyone")+'</span></div><div style="margin-top:12px"><button class="btn primary" data-play="'+g.id+'">▶ Play now</button><button class="btn" data-like="'+g.id+'">♡ Like</button><button class="btn" data-fav="'+g.id+'">☆ Favorite</button></div></div><div class="panel"><div class="eyebrow">'+esc(g.genre||"Experience")+'</div><h2>'+esc(g.title)+'</h2><p style="color:var(--muted);line-height:1.7">'+esc(g.description||"No description yet.")+'</p><div class="stats"><div class="stat"><b>'+fmt(g.visits_count)+'</b><small>Visits</small></div><div class="stat"><b>'+fmt(g.likes_count)+'</b><small>Likes</small></div><div class="stat"><b>'+fmt(g.favorites_count)+'</b><small>Favorites</small></div><div class="stat"><b>'+esc(g.current_version||"0.1.0")+'</b><small>Version</small></div></div></div></div>'}
function play(g){return '<div class="section"><button class="btn" data-r="game/'+g.id+'">← '+esc(g.title)+'</button></div><div class="play"><canvas id="canvas" class="canvas"></canvas><div class="playbar"><span class="chip">Vertex browser runtime</span><button class="btn" id="fs">Fullscreen</button></div></div><div class="notice" style="margin-top:11px">WASD / arrow keys to move. The browser runtime is separate from trusted server infrastructure.</div>'}
function download(){return '<div class="section"><div><div class="eyebrow">Vertex client</div><h2>Download</h2></div></div><div class="panel"><h3>Vertex for Windows</h3><p style="color:var(--muted)">The desktop release channel is prepared for signed releases. A live download is only shown when a verified release URL is configured, so this page never presents a fake installer.</p><button class="btn primary" disabled>Windows download not published yet</button></div>'}
function openAuth(){location.href="./signin.html"}
function is12(d){const b=new Date(d+"T00:00:00"),n=new Date();let age=n.getFullYear()-b.getFullYear();const m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))age--;return age>=12}
function ageGate(){if(localStorage.getItem("vertex_age_gate")==="12plus")return true;document.querySelector("#modal").innerHTML='<div class="modalbg"><div class="modal"><span class="age-badge">12+</span><h2>Welcome to Vertex</h2><p style="color:var(--muted);line-height:1.6">Vertex is intended for users aged 12 and over. Enter your date of birth to continue. We use it only for age eligibility in this browser.</p><div class="form"><input class="input" id="gate-dob" type="date"><button class="btn primary" id="gate-go">Continue</button><p style="font-size:12px;color:var(--muted)">By continuing, you agree to follow Vertex Community Guidelines.</p></div></div></div>';$("#gate-go").onclick=()=>{const d=$("#gate-dob").value;if(!d||!is12(d))return toast("Vertex is 12+.",false);localStorage.setItem("vertex_age_gate","12plus");$("#modal").innerHTML="";openAuthIfReset()};return false}
function openAuthIfReset(){if(S.r==="reset-password")resetPassword()}
async function resetPassword(){document.querySelector("#modal").innerHTML='<div class="modalbg"><div class="modal"><div class="eyebrow">Account security</div><h2>Set a new password</h2><div class="form"><input class="input" id="newpass" type="password" placeholder="New password"><button class="btn primary" id="setpass">Update password</button></div></div></div>';$("#setpass").onclick=async()=>{const p=$("#newpass").value;if(p.length<8)return toast("Use at least 8 characters.",false);const x=await db.auth.updateUser({password:p});if(x.error)return toast(x.error.message,false);toast("Password updated");go("settings")}}
function profileAgeGate(){
 if(!S.u||S.p?.birth_date||$("#profile-age-modal"))return;
 $("#modal").innerHTML='<div class="modalbg" id="profile-age-modal"><div class="modal"><span class="age-badge">12+</span><h2>Finish your Vertex account</h2><p style="color:var(--muted);line-height:1.6">Google sign-in does not provide Vertex with your date of birth. Add it to finish account setup and continue using Vertex.</p><div class="form"><label>Date of birth<input class="input" id="profile-dob" type="date"></label><button class="btn primary" id="finish-age">Continue</button></div></div></div>';
 $("#finish-age").onclick=async()=>{
   const dob=$("#profile-dob").value;
   if(!dob||!is12(dob))return toast("Vertex requires users to be at least 12.",false);
   const x=await db.from("vertex_profiles").update({birth_date:dob,safety_acknowledged_at:new Date().toISOString()}).eq("user_id",S.u.id);
   if(x.error)return toast(x.error.message,false);
   $("#modal").innerHTML="";
   await load();
 };
}

async function claimDailyReward(){
 if(!S.u)return openAuth();
 const x=await db.rpc("vertex_claim_daily_reward");
 if(x.error)return toast(x.error.message||"Daily reward unavailable.",false);
 toast("25 Vertex Coins added.");
 await load();
}

function supportMessageHtml(m){
 return '<div class="support-msg '+(m.role==="user"?"user":"assistant")+'">'+esc(m.content).replace(/\n/g,"<br>")+'</div>';
}

async function loadSupportHistory(){
 const x=await db.from("vertex_support_messages").select("role,content,created_at").eq("user_id",S.u.id).order("created_at",{ascending:true}).limit(40);
 if(x.error)return [];
 return x.data||[];
}

async function openSupport(){
 if(!S.u)return openAuth();
 $("#modal").innerHTML='<div class="modalbg" id="support-modal"><div class="modal" style="width:min(720px,100%)"><div class="support-head"><div><div class="eyebrow">Vertex Support</div><div class="support-title">Need help?</div><div class="support-sub">This assistant knows the current Vertex feature set and can walk you through the site.</div></div><button class="close" id="support-close">×</button></div><div id="support-messages" class="support-messages"><div class="empty" style="min-height:100px">Loading support history…</div></div><div class="support-compose"><input class="input" id="support-input" maxlength="4000" placeholder="Ask how something works…"><button class="btn primary" id="support-send">Send</button></div></div></div>';
 $("#support-close").onclick=()=>$("#modal").innerHTML="";
 const box=$("#support-messages"),history=await loadSupportHistory();
 box.innerHTML=history.length?history.map(supportMessageHtml).join(""):'<div class="support-msg assistant">Hi! I’m Vertex Support. Ask me about accounts, Google sign-in, Vertex Coins, games, Studio, Marketplace, browser play, Settings, or a problem you’re seeing.</div>';
 box.scrollTop=box.scrollHeight;
 const send=async()=>{
   const input=$("#support-input"),message=input.value.trim();
   if(!message)return;
   input.value="";
   $("#support-send").disabled=true;
   box.insertAdjacentHTML("beforeend",supportMessageHtml({role:"user",content:message}));
   box.insertAdjacentHTML("beforeend",'<div class="support-msg assistant" id="support-thinking">Thinking…</div>');
   box.scrollTop=box.scrollHeight;
   const x=await db.functions.invoke("vertex-support-bot",{body:{message}});
   $("#support-thinking")?.remove();
   if(x.error){
     box.insertAdjacentHTML("beforeend",supportMessageHtml({role:"assistant",content:x.error.message||"Support is temporarily unavailable."}));
   }else{
     box.insertAdjacentHTML("beforeend",supportMessageHtml({role:"assistant",content:x.data?.answer||"I could not generate a support reply."}));
   }
   $("#support-send").disabled=false;
   box.scrollTop=box.scrollHeight;
 };
 $("#support-send").onclick=send;
 $("#support-input").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
}

async function save(){
 if(!S.u)return openAuth();
 const p={user_id:S.u.id,display_name:$("#dn").value.trim()||"Vertex Player",username:$("#un").value.trim().toLowerCase(),bio:$("#bio").value.trim(),birth_date:$("#dob").value||null,website_url:$("#social-website_url").value.trim()||null,youtube_url:$("#social-youtube_url").value.trim()||null,tiktok_url:$("#social-tiktok_url").value.trim()||null,instagram_url:$("#social-instagram_url").value.trim()||null,x_url:$("#social-x_url").value.trim()||null,discord_url:$("#social-discord_url").value.trim()||null,safety_acknowledged_at:new Date().toISOString()};
 if(p.birth_date&&!is12(p.birth_date))return toast("Vertex requires users to be at least 12.",false);
 if(!/^[a-z0-9_]{3,24}$/.test(p.username))return toast("Username must be 3–24 lowercase characters.",false);
 const x=await db.from("vertex_profiles").upsert(p,{onConflict:"user_id"});if(x.error)return toast(x.error.message,false);
 toast("Profile saved");await load();
}
async function uploadAvatar(){
 if(!S.u)return openAuth();
 const file=$("#avatar-file")?.files?.[0];if(!file)return toast("Choose an image first.",false);
 if(!/^image\\/(jpeg|png|gif|webp)$/.test(file.type))return toast("Use JPG, PNG, GIF, or WebP.",false);
 if(file.size>2*1024*1024)return toast("Avatar images must be 2 MB or smaller.",false);
 const ext=(file.type.split("/")[1]||"png").replace("jpeg","jpg"),path=S.u.id+"/avatar-"+Date.now()+"."+ext;
 const x=await db.storage.from("avatars").upload(path,file,{contentType:file.type,upsert:false});if(x.error)return toast(x.error.message||"Avatar upload failed.",false);
 const url=db.storage.from("avatars").getPublicUrl(path).data.publicUrl;
 const p=await db.from("vertex_profiles").update({avatar_url:url}).eq("user_id",S.u.id);if(p.error)return toast(p.error.message||"Profile picture could not be saved.",false);
 toast("Profile picture updated");await load();
}
async function saveAvatar(){
 if(!S.u)return openAuth();
 const config={...(S.avatar||{})};document.querySelectorAll("[data-avatar-key]").forEach(e=>config[e.dataset.avatarKey]=e.value);
 const x=await db.from("vertex_avatar_looks").upsert({user_id:S.u.id,config},{onConflict:"user_id"});if(x.error)return toast(x.error.message||"Avatar could not be saved.",false);
 S.avatar=config;toast("Avatar saved");await load();
}
async function react(id,kind){if(!S.u)return openAuth();const table=kind==="fav"?"vertex_game_favorites":"vertex_game_likes";const x=await db.from(table).upsert({game_id:id,user_id:S.u.id},{onConflict:"game_id,user_id"});if(x.error)return toast(x.error.message,false);toast(kind==="fav"?"Added to favorites":"Liked");await load()}
function runtime(g){const c=$("#canvas");if(!c)return;const ctx=c.getContext("2d"),k=new Set();let x=120,y=120,last=performance.now();const resize=()=>{const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=r.width*d;c.height=r.height*d;ctx.setTransform(d,0,0,d,0,0)};resize();addEventListener("resize",resize);const kd=e=>k.add(e.key.toLowerCase()),ku=e=>k.delete(e.key.toLowerCase());addEventListener("keydown",kd);addEventListener("keyup",ku);const loop=t=>{const dt=Math.min((t-last)/16.7,3);last=t;if(k.has("w")||k.has("arrowup"))y-=4*dt;if(k.has("s")||k.has("arrowdown"))y+=4*dt;if(k.has("a")||k.has("arrowleft"))x-=4*dt;if(k.has("d")||k.has("arrowright"))x+=4*dt;const w=c.clientWidth,h=c.clientHeight;x=Math.max(25,Math.min(w-25,x));y=Math.max(25,Math.min(h-25,y));ctx.fillStyle="#050507";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#a78bfa18";for(let i=0;i<w;i+=48){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke()}for(let j=0;j<h;j+=48){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(w,j);ctx.stroke()}ctx.fillStyle="#a78bfa20";ctx.beginPath();ctx.arc(w*.72,h*.3,115,0,7);ctx.fill();ctx.shadowBlur=25;ctx.shadowColor="#a78bfa";ctx.fillStyle="#c4b5fd";ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.fill();ctx.shadowBlur=0;requestAnimationFrame(loop)};requestAnimationFrame(loop);$("#fs")?.addEventListener("click",()=>c.parentElement.requestFullscreen?.());if(S.u)db.rpc("vertex_record_game_visit",{p_game_id:g.id,p_session_key:"browser-"+(localStorage.vxkey||(localStorage.vxkey=crypto.randomUUID()))}).catch(()=>{})}
function legal(type){const docs={terms:["Terms of Service","Vertex is a community gaming platform. Use it respectfully, do not attempt unauthorized access, abuse the service, manipulate game statistics, or upload content that violates the Community Guidelines."],privacy:["Privacy","Vertex uses account, profile, gameplay and platform data needed to operate the service. Do not enter sensitive information into public profile fields. Review your account settings for available controls."],community:["Community Guidelines","Vertex is a 12+ community. Keep games, usernames, profiles, chat and uploads appropriate for a general teen audience. Do not harass, threaten, sexually exploit, scam, impersonate staff, evade moderation, or distribute malicious content."],copyright:["Copyright","Only upload content you have the right to use. If you believe content infringes your copyright, use the platform's support/report process." ]};const d=docs[type];return '<div class="legal"><div class="eyebrow">Vertex</div><h1>'+d[0]+'</h1><p>'+d[1]+'</p><h2>Safety first</h2><p>Vertex may moderate or remove content that violates its rules. Platform features can change as the service develops.</p><h2>Contact</h2><p>Use the support/report tools available in Vertex for account or content issues.</p></div>'}
async function owner(){
 if(!S.u||S.staff?.role!=="owner")return '<div class="panel empty"><div><h2>Owner access required</h2><p>This area is restricted to the Vertex owner role.</p></div></div>';
 const x=await db.rpc("vertex_owner_list_users",{p_search:null,p_limit:100});
 if(x.error)return '<div class="panel empty">Owner console could not load: '+esc(x.error.message||"Unknown error")+'</div>';
 return '<div class="section"><div><div class="eyebrow">Administration</div><h2>Owner Console</h2></div><span class="chip">Owner only</span></div><div class="stats"><div class="stat"><b>'+((x.data||[]).length)+'</b><small>Accounts shown</small></div><div class="stat"><b>Users</b><small>Account management</small></div><div class="stat"><b>Staff</b><small>Role controls</small></div><div class="stat"><b>Audit</b><small>Actions are logged</small></div></div><div class="panel" style="margin-top:15px"><div class="owner-toolbar"><input class="input" id="owner-search" placeholder="Search username, display name or email…"><button class="btn" id="owner-refresh">Refresh</button></div><div id="owner-users" class="owner-users">'+ownerRows(x.data||[])+'</div></div>';
}
function ownerRows(users){
 if(!users.length)return '<div class="empty">No accounts matched that search.</div>';
 return '<div class="owner-table">'+users.map(u=>'<div class="owner-row" data-owner-id="'+u.user_id+'"><div class="owner-user">'+(u.avatar_url?'<img class="owner-avatar" src="'+esc(u.avatar_url)+'" alt="">':'<div class="owner-avatar fallback">V</div>')+'<div><b>'+esc(u.display_name||"Vertex Player")+'</b><small>@'+esc(u.username||"player")+' · '+esc(u.email||"")+'</small></div></div><div class="owner-meta"><span class="chip">'+esc(u.moderation_status||"active")+'</span><span class="chip">'+esc(u.staff_role||"player")+'</span><span class="owner-coins">◆ '+fmt(u.balance)+'</span></div><div class="owner-actions"><button class="btn" data-owner-action="moderate" data-id="'+u.user_id+'">Moderate</button><button class="btn" data-owner-action="coins" data-id="'+u.user_id+'">Coins</button><button class="btn" data-owner-action="role" data-id="'+u.user_id+'">Role</button></div></div>').join("")+'</div>';
}
async function ownerRefresh(){
 const x=await db.rpc("vertex_owner_list_users",{p_search:$("#owner-search")?.value?.trim()||null,p_limit:100});
 if(x.error)return toast(x.error.message||"Owner search failed.",false);
 $("#owner-users").innerHTML=ownerRows(x.data||[]);bindOwnerActions();
}
async function ownerAction(action,id){
 if(!id||S.staff?.role!=="owner")return;
 if(action==="moderate"){
   const status=(prompt("Status: active, suspended, or banned","active")||"").trim().toLowerCase();
   if(!["active","suspended","banned"].includes(status))return toast("Invalid moderation status.",false);
   const reason=prompt("Reason (optional)","Owner action")||"";
   const x=await db.rpc("vertex_owner_set_user_moderation",{p_target:id,p_status:status,p_reason:reason,p_note:"Updated from Owner Console"});
   if(x.error)return toast(x.error.message||"Moderation update failed.",false);toast("Account moderation updated.");return ownerRefresh();
 }
 if(action==="coins"){
   const raw=prompt("Coin adjustment. Use a negative number to remove coins.","100");if(raw===null)return;
   const delta=Number(raw);if(!Number.isInteger(delta)||delta===0)return toast("Enter a non-zero whole number.",false);
   const reason=prompt("Reason","Owner adjustment")||"Owner adjustment";
   const x=await db.rpc("vertex_owner_adjust_currency",{p_target:id,p_delta:delta,p_reason:reason});
   if(x.error)return toast(x.error.message||"Currency update failed.",false);toast("Balance updated to "+fmt(x.data)+" coins.");return ownerRefresh();
 }
 if(action==="role"){
   const role=(prompt("Role: staff, moderator, or admin","staff")||"").trim().toLowerCase();
   if(!["staff","moderator","admin"].includes(role))return toast("Invalid staff role.",false);
   const x=await db.rpc("vertex_owner_set_staff_role",{p_target:id,p_role:role,p_capabilities:[]});
   if(x.error)return toast(x.error.message||"Role update failed.",false);toast("Staff role updated.");return ownerRefresh();
 }
}
function bindOwnerActions(){document.querySelectorAll("[data-owner-action]").forEach(b=>b.onclick=()=>ownerAction(b.dataset.ownerAction,b.dataset.id))}
async function render(){
 nav();
 let r=S.r,v=r==="home"?home():r==="discover"?discover():r==="games"?games():r==="friends"?friends():r==="avatar"?avatar():r==="groups"?groups():r==="studio"?studio():r==="analytics"?await analytics():r==="assets"?simple("Creator","Asset Vault","<h3>Private game assets</h3><p style='color:var(--muted)'>Uploads use the existing authenticated Supabase Storage policies. No fake assets are shown.</p>"):r==="marketplace"?simple("Economy","Marketplace","<p style='color:var(--muted)'>Marketplace inventory is sourced from the Vertex backend. No fake products or purchases are displayed.</p>"):r==="messages"?simple("Social","Messages","<div class='empty'>Your conversations will appear here when active messages exist.</div>"):r==="notifications"?simple("Updates","Notifications","<div class='empty'>No notifications are displayed until the backend reports them.</div>"):r==="settings"?settings():r==="owner"?await owner():r==="download"?download():["terms","privacy","community","copyright"].includes(r)?legal(r):r.startsWith("game/")?detail(currentGame()):r.startsWith("play/")?play(currentGame()):r==="reset-password"?simple("Account security","Reset password","<p style='color:var(--muted)'>Use the reset link from your email to open the password form.</p>"):home();
 $("#view").innerHTML=v;
 document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>go(b.dataset.r));
 document.querySelectorAll("[data-game]").forEach(b=>b.onclick=()=>go("game/"+b.dataset.game));
 $("#side-login")?.addEventListener("click",()=>location.href="./signin.html");
 $("#top-profile").onclick=()=>S.u?go("settings"):location.href="./signin.html";
 $("#save")?.addEventListener("click",save);$("#upload-avatar")?.addEventListener("click",uploadAvatar);
 $("#logout")?.addEventListener("click",async()=>{await db.auth.signOut();location.href="./signin.html"});
 $("#reset-password")?.addEventListener("click",resetPassword);$("#daily-reward")?.addEventListener("click",claimDailyReward);$("#open-support")?.addEventListener("click",openSupport);$("#settings-login")?.addEventListener("click",()=>location.href="./signin.html");
 $("#discover-q")?.addEventListener("input",async e=>{S.q=e.target.value.trim();await load()});
 $("#avatar-save")?.addEventListener("click",saveAvatar);
 document.querySelectorAll("[data-avatar-key]").forEach(e=>e.addEventListener("change",()=>{
   const p=$("#avatar-preview");if(!p)return;const c={...(S.avatar||{})};document.querySelectorAll("[data-avatar-key]").forEach(x=>c[x.dataset.avatarKey]=x.value);
   p.className="roblox-avatar "+(c.accent||"violet");p.querySelector(".av-head").className="av-head "+(c.head||"classic");p.querySelector(".av-hair").className="av-hair "+(c.hair||"short");p.querySelector(".av-body").className="av-body "+(c.shirt||"plain");p.querySelector(".av-legs").className="av-legs "+(c.pants||"plain");p.querySelector(".av-accessory").className="av-accessory "+(c.accessory||"none");
 }));
 $("#owner-refresh")?.addEventListener("click",ownerRefresh);$("#owner-search")?.addEventListener("keydown",e=>{if(e.key==="Enter")ownerRefresh()});bindOwnerActions();
 document.querySelectorAll("[data-like]").forEach(b=>b.onclick=()=>react(b.dataset.like,"like"));document.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>react(b.dataset.fav,"fav"));document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>go("play/"+b.dataset.play));
 if(r.startsWith("play/"))runtime(currentGame());if(r==="reset-password")resetPassword();
}
$("#menu").onclick=()=>$("#side").classList.toggle("open");$("#search").onkeydown=async e=>{if(e.key==="Enter"){S.q=e.target.value.trim();go("discover");await load()}};addEventListener("hashchange",()=>{S.r=location.hash.slice(1)||"home";render();$("#side").classList.remove("open")});db.auth.onAuthStateChange(()=>setTimeout(load,0));(async()=>{await load();if(S.r==="reset-password"){resetPassword();return}ageGate()})();
})();