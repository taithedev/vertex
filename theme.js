(()=>{"use strict";
const key="vertex-theme",accentKey="vertex-accent";
const systemTheme=()=>matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";
function apply(theme,accent){
 const resolved=theme==="system"?systemTheme():theme;
 document.documentElement.dataset.theme=resolved;
 const a=accent||localStorage.getItem(accentKey)||"#a98cff";
 document.documentElement.style.setProperty("--accent",a);
 document.documentElement.style.setProperty("--accent-soft",a);
 localStorage.setItem(key,theme||"dark");
 localStorage.setItem(accentKey,a);
}
async function boot(){
 apply(localStorage.getItem(key)||"dark",localStorage.getItem(accentKey)||"#a98cff");
 matchMedia("(prefers-color-scheme: light)").addEventListener?.("change",()=>{if(localStorage.getItem(key)==="system")apply("system")});
}
window.VertexTheme={apply,boot};
addEventListener("DOMContentLoaded",boot);
})();