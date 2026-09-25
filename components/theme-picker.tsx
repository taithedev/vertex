"use client";

import { useEffect, useState } from "react";

const themes = [
  ["vertex-dark","Vertex Dark"],["midnight","Midnight"],["purple","Purple"],
  ["neon","Neon"],["aurora","Aurora"],["light","Light"],["amoled","AMOLED"]
] as const;

export function ThemePicker(){
  const [theme,setTheme]=useState("vertex-dark");
  useEffect(()=>{
    const saved=localStorage.getItem("vertex-theme")??"vertex-dark";
    setTheme(saved);
    document.documentElement.dataset.theme=saved;
  },[]);
  function change(value:string){
    setTheme(value);
    localStorage.setItem("vertex-theme",value);
    document.documentElement.dataset.theme=value;
  }
  return <div className="field">
    <label className="label">Theme</label>
    <select className="select" value={theme} onChange={e=>change(e.target.value)}>
      {themes.map(([id,label])=><option key={id} value={id}>{label}</option>)}
    </select>
  </div>;
}
