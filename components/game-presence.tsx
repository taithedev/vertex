"use client";

import { useEffect, useState } from "react";
import { Radio, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function GamePresence({gameId}:{gameId:string}){
  const [supabase]=useState(()=>createClient());
  const [count,setCount]=useState(0),[connected,setConnected]=useState(false);
  useEffect(()=>{
    const channel=supabase.channel("vertex-room-"+gameId,{config:{presence:{key:crypto.randomUUID()}}});
    const sync=()=>setCount(Object.values(channel.presenceState()).flat().length);
    channel.on("presence",{event:"sync"},sync);
    channel.on("presence",{event:"join"},sync);
    channel.on("presence",{event:"leave"},sync);
    channel.subscribe(async status=>{
      if(status!=="SUBSCRIBED")return;
      setConnected(true);
      const {error}=await channel.track({online_at:new Date().toISOString()});
      if(error)setConnected(false);
    });
    return()=>{setConnected(false);void supabase.removeChannel(channel)};
  },[gameId,supabase]);
  return <div className="hud-card"><div className="stack" style={{gap:7}}><Radio size={13}/><strong>{connected?"Room live":"Connecting"}</strong><span className="meta"><Users size={12} style={{verticalAlign:"-2px"}}/> {count}</span></div><div className="meta">Low-frequency presence</div></div>;
}
