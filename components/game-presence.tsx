"use client";

import { useEffect, useState } from "react";
import { Radio, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Presence={user_id:string;online_at:string};

export function GamePresence({gameId}:{gameId:string}){
  const [supabase]=useState(()=>createClient());
  const [count,setCount]=useState(0),[connected,setConnected]=useState(false);
  useEffect(()=>{
    const channel=supabase.channel("vertex-room-"+gameId,{config:{presence:{key:crypto.randomUUID()}}});
    channel.on("presence",{event:"sync"},()=>{setCount(Object.values(channel.presenceState<Presence>()).flat().length)});
    channel.on("presence",{event:"join"},()=>{setCount(Object.values(channel.presenceState<Presence>()).flat().length)});
    channel.on("presence",{event:"leave"},()=>{setCount(Object.values(channel.presenceState<Presence>()).flat().length)});
    channel.subscribe(async status=>{if(status!=="SUBSCRIBED")return;setConnected(true);await channel.track({online_at:new Date().toISOString()})});
    return()=>{setConnected(false);void supabase.removeChannel(channel)};
  },[gameId,supabase]);
  return <div className="hud-card"><div className="stack" style={{gap:7}}><Radio size={13}/><strong>{connected?"Room live":"Connecting"}</strong><span className="meta"><Users size={12} style={{verticalAlign:"-2px"}}/> {count}</span></div><div className="meta">Presence sync</div></div>;
}
