"use client";

import { Maximize2 } from "lucide-react";

export function FullscreenButton(){
  async function enterFullscreen(){
    if(document.fullscreenElement){await document.exitFullscreen();return}
    await document.documentElement.requestFullscreen();
  }
  return <button className="btn sm" type="button" onClick={enterFullscreen}><Maximize2 size={14}/>Fullscreen</button>;
}
