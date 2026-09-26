(()=>{"use strict";
const SB_URL="https://zqvntzvugfbvdwkoxfbm.supabase.co";
const SB_KEY="sb_publishable_hXc8J0cDIXTKJn5eQVJQrw_jsyYJjYy";
const db=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const setStatus=(m,ok=false)=>{const e=$("#status");if(e){e.textContent=m;e.className="status "+(ok?"good":"bad")}};
const is12=d=>{const b=new Date(d+"T00:00:00"),n=new Date();let a=n.getFullYear()-b.getFullYear(),m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return a>=12};
let U=null,P=null,A={};let staff=null;

async function load(){
  const s=await db.auth.getSession();U=s.data.session?.user||null;
  if(!U){location.href="./signin.html";return}
  const [p,a,r]=await Promise.all([
    db.from("vertex_profiles").select("*").eq("user_id",U.id).maybeSingle(),
    db.from("vertex_avatar_looks").select("config").eq("user_id",U.id).maybeSingle(),
    db.rpc("vertex_my_staff_role")
  ]);
  P=p.data||null;A=a.data?.config||{};staff=r.data?.[0]||null;
  renderProfile();renderAvatar();bind();
}

function renderProfile(){
  const p=P||{},avatar=p.avatar_url||"";
  $("#profile").innerHTML="<img class='pfp "+(avatar?"":"fallback")+"' src='"+esc(avatar)+"' alt='' onerror='this.style.display="none"'>"+
    "<div><h1 style='margin:0'>"+esc(p.display_name||"Vertex Player")+"</h1><div class='handle'>@"+esc(p.username||"player")+"</div><p class='bio'>"+esc(p.bio||"Add a bio to your profile.")+"</p></div>";
  $("#fields").innerHTML=
    "<label class='field'>Display name<input class='input' id='display' maxlength='40' value='"+esc(p.display_name||"")+"'></label>"+
    "<label class='field'>Username<input class='input' id='username' maxlength='24' value='"+esc(p.username||"")+"'></label>"+
    "<label class='field'>Bio<textarea class='area' id='bio' maxlength='280'>"+esc(p.bio||"")+"</textarea></label>"+
    "<label class='field'>Date of birth<input class='input' id='dob' type='date' value='"+esc(p.birth_date||"")+"'></label>"+
    "<div class='social-grid'><label class='field'>Website<input class='input' id='website_url' value='"+esc(p.website_url||"")+"' maxlength='300'></label>"+
    "<label class='field'>YouTube<input class='input' id='youtube_url' value='"+esc(p.youtube_url||"")+"' maxlength='300'></label>"+
    "<label class='field'>TikTok<input class='input' id='tiktok_url' value='"+esc(p.tiktok_url||"")+"' maxlength='300'></label>"+
    "<label class='field'>Instagram<input class='input' id='instagram_url' value='"+esc(p.instagram_url||"")+"' maxlength='300'></label>"+
    "<label class='field'>X<input class='input' id='x_url' value='"+esc(p.x_url||"")+"' maxlength='300'></label>"+
    "<label class='field'>Discord<input class='input' id='discord_url' value='"+esc(p.discord_url||"")+"' maxlength='300'></label></div>";
  $("#picture").innerHTML=(avatar?"<img class='pfp' src='"+esc(avatar)+"' alt=''>":"<div class='pfp fallback'>V</div>")+"<input class='input' id='pfp-file' type='file' accept='image/jpeg,image/png,image/gif,image/webp'><button class='btn primary' id='upload'>Upload profile picture</button>";
}

function avatarHtml(){
  const c=A||{};
  return "<div id='avatar-preview' class='roblox-avatar "+esc(c.accent||"violet")+"'><div class='av-head "+esc(c.head||"classic")+"'><div class='av-face'><i></i><i></i></div></div><div class='av-hair "+esc(c.hair||"short")+"'></div><div class='av-body "+esc(c.shirt||"plain")+"'></div><div class='av-legs "+esc(c.pants||"plain")+"'><span></span><span></span></div><div class='av-accessory "+esc(c.accessory||"none")+"'></div></div>";
}
function renderAvatar(){
  $("#avatar-preview-wrap").innerHTML=avatarHtml();
  const c=A||{},sets=[["head","Head",["classic","square"]],["hair","Hair",["none","short","spiky"]],["shirt","Shirt",["plain","hoodie","jacket"]],["pants","Pants",["plain","jeans"]],["accessory","Accessory",["none","cap","glasses"]],["accent","Accent",["violet","blue","pink"]]];
  $("#avatar-fields").innerHTML=sets.map(x=>"<label class='field'>"+x[1]+"<select class='select' data-avatar='"+x[0]+"'>"+x[2].map(v=>"<option value='"+v+"' "+(c[x[0]]===v?"selected":"")+">"+v.charAt(0).toUpperCase()+v.slice(1)+"</option>").join("")+"</select></label>").join("");
}

function preview(){
  const c={...A};document.querySelectorAll("[data-avatar]").forEach(x=>c[x.dataset.avatar]=x.value);
  const p=$("#avatar-preview");if(!p)return;
  p.className="roblox-avatar "+(c.accent||"violet");
  p.querySelector(".av-head").className="av-head "+(c.head||"classic");
  p.querySelector(".av-hair").className="av-hair "+(c.hair||"short");
  p.querySelector(".av-body").className="av-body "+(c.shirt||"plain");
  p.querySelector(".av-legs").className="av-legs "+(c.pants||"plain");
  p.querySelector(".av-accessory").className="av-accessory "+(c.accessory||"none");
}

async function saveProfile(){
  const data={user_id:U.id,display_name:$("#display").value.trim()||"Vertex Player",username:$("#username").value.trim().toLowerCase(),bio:$("#bio").value.trim(),birth_date:$("#dob").value||null,website_url:$("#website_url").value.trim()||null,youtube_url:$("#youtube_url").value.trim()||null,tiktok_url:$("#tiktok_url").value.trim()||null,instagram_url:$("#instagram_url").value.trim()||null,x_url:$("#x_url").value.trim()||null,discord_url:$("#discord_url").value.trim()||null,safety_acknowledged_at:new Date().toISOString()};
  if(!/^[a-z0-9_]{3,24}$/.test(data.username))return setStatus("Username must be 3–24 lowercase letters, numbers, or underscores.");
  if(data.birth_date&&!is12(data.birth_date))return setStatus("Vertex requires users to be at least 12.");
  const r=await db.from("vertex_profiles").upsert(data,{onConflict:"user_id"});
  if(r.error)return setStatus(r.error.message);
  setStatus("Profile saved",true);await load();
}

async function upload(){
  const file=$("#pfp-file")?.files?.[0];if(!file)return setStatus("Choose an image first.");
  if(!/^image\/(jpeg|png|gif|webp)$/.test(file.type))return setStatus("Use JPG, PNG, GIF, or WebP.");
  if(file.size>2*1024*1024)return setStatus("Profile pictures must be 2 MB or smaller.");
  const ext=(file.type.split("/")[1]||"png").replace("jpeg","jpg"),path=U.id+"/avatar-"+Date.now()+"."+ext;
  const r=await db.storage.from("avatars").upload(path,file,{contentType:file.type,upsert:false});
  if(r.error)return setStatus(r.error.message);
  const url=db.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const s=await db.from("vertex_profiles").update({avatar_url:url}).eq("user_id",U.id);
  if(s.error)return setStatus(s.error.message);
  setStatus("Profile picture updated",true);await load();
}

async function saveAvatar(){
  const config={...A};document.querySelectorAll("[data-avatar]").forEach(x=>config[x.dataset.avatar]=x.value);
  const r=await db.from("vertex_avatar_looks").upsert({user_id:U.id,config:config},{onConflict:"user_id"});
  if(r.error)return setStatus(r.error.message);
  A=config;setStatus("Avatar saved",true);
}

async function daily(){
  const r=await db.rpc("vertex_claim_daily_reward");
  if(r.error)return setStatus(r.error.message);
  setStatus("25 Vertex Coins added.",true);
}

function bind(){
  $("#save-profile").onclick=saveProfile;$("#upload").onclick=upload;$("#save-avatar").onclick=saveAvatar;
  document.querySelectorAll("[data-avatar]").forEach(x=>x.onchange=preview);
  $("#daily").onclick=daily;
  $("#signout").onclick=async()=>{await db.auth.signOut();location.href="./signin.html"};
  $("#back").onclick=()=>{location.href="./index.html#home"};
  if(staff?.role==="owner")$("#owner").style.display="inline-flex",$("#owner").onclick=()=>{location.href="./owner.html"};
}

addEventListener("load",load);
})();