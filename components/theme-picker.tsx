"use client";

import { useEffect, useState } from "react";

const themes = [
  ["vertex-dark","Vertex Dark"],["midnight","Midnight"],["purple","Purple"],
  ["neon","Neon"],["aurora","Aurora"],["light","Light"],["amoled","AMOLED"]
] as const;

export function ThemePicker(){
  const [theme,setTheme]=useState(()=>typeof window==="undefined"?"vertex-dark":localStorage.getItem("vertex-theme")??"vertex-dark");
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("vertex-theme",theme)},[theme]);
  return <div className="field">
    <label className="label">Theme</label>
    <select className="select" value={theme} onChange={e=>setTheme(e.target.value)}>
      {themes.map(([id,label])=><option key={id} value={id}>{label}</option>)}
    </select>
  </div>;
}
