(()=>{"use strict";
const SB_URL="https://zqvntzvugfbvdwkoxfbm.supabase.co";
const SB_KEY="sb_publishable_hXc8J0cDIXTKJn5eQVJQrw_jsyYJjYy";
const db=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const S={u:null,p:null,g:[],currency:0,r:location.hash.slice(1)||"home",q:""};
const $=(s,r=document)=>r.querySelector(s);
const esc=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=x=>Intl.NumberFormat(undefined,{notation:Number(x)>999?"compact":"standard",maximumFractionDigits:1}).format(Number(x||0));
const toast=(m,good=true)=>{const d=document.createElement("div");d.className="toast "+(good?"good":"bad");d.textContent=m;$("#toast").append(d);setTimeout(()=>d.remove(),3000)};
const go=r=>{location.hash=r};
const currentGame=()=>S.g.find(g=>g.id===S.r.split("/")[1]);

async function load(){
 const session=await db.auth.getSession();
 S.u=session.data.session?.user||null;
 S.p=null;
 S.currency=0;
 if(S.u){
   const [p,c]=await Promise.all([
     db.from("vertex_profiles").select("*").eq("user_id",S.u.id).maybeSingle(),
     db.from("vertex_currency_accounts").select("balance").eq("user_id",S.u.id).maybeSingle()
   ]);
   S.p=p.data||null;
   S.currency=Number(c.data?.balance||0);
 }
 let q=db.from("vertex_games").select("id,creator_id,title,description,genre,status,age_rating,thumbnail_url,likes_count,favorites_count,visits_count,current_version,published_at").eq("status","published").order("published_at",{ascending:false}).limit(80);
 if(S.q)q=q.ilike("title","%"+S.q.replace(/[%_]/g,"")+"%");
 const games=await q;
 S.g=games.data||[];
 await render();
 if(S.u&&S.p&&!S.p.birth_date)profileAgeGate();
}
function nav(){
 document.querySelectorAll(".main-nav button").forEach(b=>b.classList.toggle("active",b.dataset.r===S.r.split("/")[0]));
 $("#account").innerHTML=S.u?'<button class="account" data-r="settings"><b>'+esc(S.p?.display_name||"Vertex Player")+'</b><small>@'+esc(S.p?.username||"player")+'</small><small class="account-balance">◆ '+fmt(S.currency)+' Vertex Coins</small></button>':'<button class="btn primary" style="width:100%" id="side-login">Sign in</button>';
 $("#top-profile").textContent=S.u?(S.p?.display_name||"Account"):"Sign in";
 $("#currency-balance").textContent=fmt(S.currency);
}
function cards(list=S.g){return list.length?'<div class="grid">'+list.map(g=>'<article class="card" data-game="'+g.id+'"><div class="cover" '+(g.thumbnail_url?'style="background-image:url('+JSON.stringify(g.thumbnail_url)+')"':'')+'><span class="tag">'+esc(g.genre||"Experience")+'</span></div><div class="body"><div class="title">'+esc(g.title)+'</div><div class="meta"><span>'+fmt(g.visits_count)+' visits</span><span>♡ '+fmt(g.likes_count)+'</span></div></div></article>').join("")+'</div>':'<div class="panel empty">No published experiences found.</div>'}
function home(){return '<div class="hero"><div><div class="eyebrow">Welcome to Vertex</div><h1>Play what you love.<br><span style="color:var(--accent2)">Find your people.</span></h1><p>Discover community-made experiences, meet friends and explore a growing player-first universe built on Vertex.</p><div class="hero-actions"><button class="btn primary" data-r="games">Explore experiences</button><button class="btn" data-r="studio">Open Studio</button></div></div><div class="hero-card"><span style="color:var(--muted)">Live catalog</span><div class="big">'+fmt(S.g.length)+'</div><span style="color:var(--muted)">published experiences</span><hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><span class="age-badge">12+</span><p style="font-size:12px;margin:10px 0 0">Vertex is designed around a 12+ community standard.</p></div></div><div class="section"><div><div class="eyebrow">Explore</div><h2>Featured experiences</h2></div><button class="btn" data-r="games">See all</button></div>'+cards()}
function games(){return '<div class="section"><div><div class="eyebrow">Catalog</div><h2>Experiences</h2></div><button class="btn primary" data-r="studio">Studio</button></div>'+cards()}
function discover(){return '<div class="section"><div><div class="eyebrow">Discover</div><h2>Find your next experience</h2></div></div><div class="panel"><input class="input" id="discover-q" value="'+esc(S.q)+'" placeholder="Search games and experiences..."></div><div style="height:15px"></div>'+cards()}
function friends(){return '<div class="section"><div><div class="eyebrow">Social</div><h2>Friends</h2></div></div><div class="panel empty">'+(S.u?"Your friend list will appear here as social connections are added.":"Sign in to connect with friends.")+'</div>'}
function avatar(){return '<div class="section"><div><div class="eyebrow">Identity</div><h2>Avatar</h2></div></div><div class="panel"><h3>Customize your presence</h3><p style="color:var(--muted)">Avatar inventory and cosmetics can use the existing Vertex marketplace and profile systems. This shell intentionally does not invent inventory data that is not in Supabase.</p><button class="btn" data-r="marketplace">Open Marketplace</button></div>'}
function groups(){return '<div class="section"><div><div class="eyebrow">Community</div><h2>Groups</h2></div></div><div class="panel empty">Groups are ready for the Vertex community layer. No fake groups are displayed.</div>'}
function studio(){return '<div class="section"><div><div class="eyebrow">Creator</div><h2>Studio</h2></div></div><div class="stats"><div class="stat"><b>'+S.g.filter(g=>g.creator_id===S.u?.id).length+'</b><small>Your published experiences</small></div><div class="stat"><b>Live</b><small>Publishing pipeline</small></div><div class="stat"><b>Ready</b><small>Browser runtime</small></div><div class="stat"><b>12+</b><small>Community standard</small></div></div><div class="cols" style="margin-top:17px"><div class="panel"><h3>Creator dashboard</h3><p style="color:var(--muted)">Analytics, asset storage and publishing systems remain connected to the existing Vertex backend.</p><button class="btn" data-r="analytics">Analytics</button><button class="btn" data-r="assets">Asset Vault</button></div><div class="panel"><h3>Creation scope</h3><p style="color:var(--muted)">Scene editing, script editing and the larger new-game creation expansion remain paused as requested.</p></div></div>'}
async function analytics(){if(!S.u)return '<div class="panel empty">Sign in to view analytics.</div>';const g=S.g.filter(x=>x.creator_id===S.u.id),v=g.reduce((a,x)=>a+Number(x.visits_count||0),0),l=g.reduce((a,x)=>a+Number(x.likes_count||0),0),f=g.reduce((a,x)=>a+Number(x.favorites_count||0),0);return '<div class="section"><div><div class="eyebrow">Creator data</div><h2>Analytics</h2></div></div><div class="stats"><div class="stat"><b>'+g.length+'</b><small>Published</small></div><div class="stat"><b>'+fmt(v)+'</b><small>Visits</small></div><div class="stat"><b>'+fmt(l)+'</b><small>Likes</small></div><div class="stat"><b>'+fmt(f)+'</b><small>Favorites</small></div></div><div class="panel" style="margin-top:17px"><table style="width:100%;border-collapse:collapse"><tr><th align="left">Experience</th><th>Visits</th><th>Likes</th></tr>'+g.map(x=>'<tr><td style="padding:10px 0">'+esc(x.title)+'</td><td align="center">'+fmt(x.visits_count)+'</td><td align="center">'+fmt(x.likes_count)+'</td></tr>').join("")+'</table></div>'}
function simple(title,sub,body){return '<div class="section"><div><div class="eyebrow">'+title+'</div><h2>'+sub+'</h2></div></div><div class="panel">'+body+'</div>'}
function settings(){
 if(!S.u)return '<div class="panel empty"><div><h2>Sign in to open Settings</h2><p>Manage your Vertex account, currency, security and support from one place.</p><button class="btn primary" id="settings-login">Sign in</button></div></div>';
 return '<div class="section"><div><div class="eyebrow">Account</div><h2>Settings</h2></div></div>'+
 '<div class="stats"><div class="stat"><b>'+fmt(S.currency)+'</b><small>Vertex Coins</small></div><div class="stat"><b>100</b><small>Welcome coins</small></div><div class="stat"><b>25</b><small>Daily reward</small></div><div class="stat"><b>12+</b><small>Platform age</small></div></div>'+
 '<div class="cols" style="margin-top:15px">'+
 '<div class="panel"><h3>Profile</h3><div class="form"><label>Display name<input class="input" id="dn" value="'+esc(S.p?.display_name||"")+'"></label><label>Username<input class="input" id="un" value="'+esc(S.p?.username||"")+'"></label><label>Bio<textarea class="area" id="bio">'+esc(S.p?.bio||"")+'</textarea></label><label>Date of birth<input class="input" id="dob" type="date" value="'+esc(S.p?.birth_date||"")+'"></label><button class="btn primary" id="save">Save profile</button></div></div>'+
 '<div class="panel"><h3>Vertex Coins</h3><p style="color:var(--muted);line-height:1.6">Use Vertex Coins for supported marketplace items. New accounts start with 100 coins, and the daily reward adds 25 coins every 24 hours.</p><button class="btn primary" id="daily-reward">Claim 25 coins</button><button class="btn" data-r="marketplace">Open Marketplace</button></div>'+
 '</div>'+
 '<div class="cols" style="margin-top:15px">'+
 '<div class="panel"><h3>Security</h3><p style="color:var(--muted)">'+esc(S.u.email||"")+'</p><button class="btn" id="reset-password">Change password</button><button class="btn danger" id="logout">Sign out</button></div>'+
 '<div class="panel support-shell"><div class="support-head"><div><div class="support-title">Vertex Support</div><div class="support-sub">Ask about accounts, games, Studio, currency, settings, browser play and other Vertex features.</div></div><span class="chip">Groq</span></div><button class="btn primary" id="open-support">Open support chat</button></div>'+
 '</div>';
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

async function save(){if(!S.u)return openAuth();const p={user_id:S.u.id,display_name:$("#dn").value.trim()||"Vertex Player",username:$("#un").value.trim().toLowerCase(),bio:$("#bio").value.trim(),birth_date:$("#dob").value||null,safety_acknowledged_at:new Date().toISOString()};if(p.birth_date&&!is12(p.birth_date))return toast("Vertex requires users to be at least 12.",false);if(!/^[a-z0-9_]{3,24}$/.test(p.username))return toast("Username must be 3–24 lowercase characters.",false);const x=await db.from("vertex_profiles").upsert(p,{onConflict:"user_id"});if(x.error)return toast(x.error.message,false);toast("Profile saved");await load()}
async function react(id,kind){if(!S.u)return openAuth();const table=kind==="fav"?"vertex_game_favorites":"vertex_game_likes";const x=await db.from(table).upsert({game_id:id,user_id:S.u.id},{onConflict:"game_id,user_id"});if(x.error)return toast(x.error.message,false);toast(kind==="fav"?"Added to favorites":"Liked");await load()}
function runtime(g){const c=$("#canvas");if(!c)return;const ctx=c.getContext("2d"),k=new Set();let x=120,y=120,last=performance.now();const resize=()=>{const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=r.width*d;c.height=r.height*d;ctx.setTransform(d,0,0,d,0,0)};resize();addEventListener("resize",resize);const kd=e=>k.add(e.key.toLowerCase()),ku=e=>k.delete(e.key.toLowerCase());addEventListener("keydown",kd);addEventListener("keyup",ku);const loop=t=>{const dt=Math.min((t-last)/16.7,3);last=t;if(k.has("w")||k.has("arrowup"))y-=4*dt;if(k.has("s")||k.has("arrowdown"))y+=4*dt;if(k.has("a")||k.has("arrowleft"))x-=4*dt;if(k.has("d")||k.has("arrowright"))x+=4*dt;const w=c.clientWidth,h=c.clientHeight;x=Math.max(25,Math.min(w-25,x));y=Math.max(25,Math.min(h-25,y));ctx.fillStyle="#050507";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#a78bfa18";for(let i=0;i<w;i+=48){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke()}for(let j=0;j<h;j+=48){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(w,j);ctx.stroke()}ctx.fillStyle="#a78bfa20";ctx.beginPath();ctx.arc(w*.72,h*.3,115,0,7);ctx.fill();ctx.shadowBlur=25;ctx.shadowColor="#a78bfa";ctx.fillStyle="#c4b5fd";ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.fill();ctx.shadowBlur=0;requestAnimationFrame(loop)};requestAnimationFrame(loop);$("#fs")?.addEventListener("click",()=>c.parentElement.requestFullscreen?.());if(S.u)db.rpc("vertex_record_game_visit",{p_game_id:g.id,p_session_key:"browser-"+(localStorage.vxkey||(localStorage.vxkey=crypto.randomUUID()))}).catch(()=>{})}
function legal(type){const docs={terms:["Terms of Service","Vertex is a community gaming platform. Use it respectfully, do not attempt unauthorized access, abuse the service, manipulate game statistics, or upload content that violates the Community Guidelines."],privacy:["Privacy","Vertex uses account, profile, gameplay and platform data needed to operate the service. Do not enter sensitive information into public profile fields. Review your account settings for available controls."],community:["Community Guidelines","Vertex is a 12+ community. Keep games, usernames, profiles, chat and uploads appropriate for a general teen audience. Do not harass, threaten, sexually exploit, scam, impersonate staff, evade moderation, or distribute malicious content."],copyright:["Copyright","Only upload content you have the right to use. If you believe content infringes your copyright, use the platform's support/report process." ]};const d=docs[type];return '<div class="legal"><div class="eyebrow">Vertex</div><h1>'+d[0]+'</h1><p>'+d[1]+'</p><h2>Safety first</h2><p>Vertex may moderate or remove content that violates its rules. Platform features can change as the service develops.</p><h2>Contact</h2><p>Use the support/report tools available in Vertex for account or content issues.</p></div>'}
async function render(){nav();let r=S.r,v=r==="home"?home():r==="discover"?discover():r==="games"?games():r==="friends"?friends():r==="avatar"?avatar():r==="groups"?groups():r==="studio"?studio():r==="analytics"?await analytics():r==="assets"?simple("Creator","Asset Vault","<h3>Private game assets</h3><p style='color:var(--muted)'>Uploads use the existing authenticated Supabase Storage policies. No fake assets are shown.</p>"):r==="marketplace"?simple("Economy","Marketplace","<p style='color:var(--muted)'>Marketplace inventory is sourced from the Vertex backend. No fake products or purchases are displayed.</p>"):r==="messages"?simple("Social","Messages","<div class='empty'>Your conversations will appear here when active messages exist.</div>"):r==="notifications"?simple("Updates","Notifications","<div class='empty'>No notifications are displayed until the backend reports them.</div>"):r==="settings"?settings():r==="download"?download():["terms","privacy","community","copyright"].includes(r)?legal(r):r.startsWith("game/")?detail(currentGame()):r.startsWith("play/")?play(currentGame()):r==="reset-password"?simple("Account security","Reset password","<p style='color:var(--muted)'>Use the reset link from your email to open the password form.</p>"):home();$("#view").innerHTML=v;document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>go(b.dataset.r));document.querySelectorAll("[data-game]").forEach(b=>b.onclick=()=>go("game/"+b.dataset.game));$("#side-login")?.addEventListener("click",openAuth);$("#top-profile").onclick=()=>S.u?go("settings"):openAuth();$("#save")?.addEventListener("click",save);$("#logout")?.addEventListener("click",async()=>{await db.auth.signOut();await load()});$("#reset-password")?.addEventListener("click",resetPassword);$("#daily-reward")?.addEventListener("click",claimDailyReward);$("#open-support")?.addEventListener("click",openSupport);$("#settings-login")?.addEventListener("click",openAuth);$("#discover-q")?.addEventListener("input",async e=>{S.q=e.target.value.trim();await load()});document.querySelectorAll("[data-like]").forEach(b=>b.onclick=()=>react(b.dataset.like,"like"));document.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>react(b.dataset.fav,"fav"));document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>go("play/"+b.dataset.play));if(r.startsWith("play/"))runtime(currentGame());if(r==="reset-password")resetPassword()}
$("#menu").onclick=()=>$("#side").classList.toggle("open");$("#search").onkeydown=async e=>{if(e.key==="Enter"){S.q=e.target.value.trim();go("discover");await load()}};addEventListener("hashchange",()=>{S.r=location.hash.slice(1)||"home";render();$("#side").classList.remove("open")});db.auth.onAuthStateChange(()=>setTimeout(load,0));(async()=>{await load();if(S.r==="reset-password"){resetPassword();return}ageGate()})();
})();