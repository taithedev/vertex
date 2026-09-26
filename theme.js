(()=>{"use strict";
const SB_URL="https://zqvntzvugfbvdwkoxfbm.supabase.co";
const SB_KEY="sb_publishable_hXc8J0cDIXTKJn5eQVJQrw_jsyYJjYy";
const db=window.__vertexThemeDb||supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.__vertexThemeDb=db;
const key="vertex-theme";
const accentKey="vertex-accent";
const systemTheme=()=>matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";
function apply(theme,accent){
  const resolved=theme==="system"?systemTheme():theme;
  document.documentElement.dataset.theme=resolved;
  document.documentElement.style.setProperty("--accent",accent||localStorage.getItem(accentKey)||"#a98cff");
  document.documentElement.style.setProperty("--accent-soft",accent||localStorage.getItem(accentKey)||"#c8b8ff");
  localStorage.setItem(key,theme||"dark");
  if(accent)localStorage.setItem(accentKey,accent);
}
async function boot(){
  let theme=localStorage.getItem(key)||"dark",accent=localStorage.getItem(accentKey)||"#a98cff";
  try{
    const s=await db.auth.getSession(),u=s.data.session?.user;
    if(u){
      const {data}=await db.from("vertex_profiles").select("theme,accent_color").eq("user_id",u.id).maybeSingle();
      if(data?.theme){theme=data.theme;localStorage.setItem(key,theme)}
      if(data?.accent_color){accent=data.accent_color;localStorage.setItem(accentKey,accent)}
    }
  }catch{}
  apply(theme,accent);
  matchMedia("(prefers-color-scheme: light)").addEventListener?.("change",()=>{if(localStorage.getItem(key)==="system")apply("system")});
}
window.VertexTheme={apply,boot,db};
addEventListener("DOMContentLoaded",boot);
})();