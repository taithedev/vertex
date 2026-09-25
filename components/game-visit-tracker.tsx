"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getKey(){
  try{
    const existing=window.localStorage.getItem("vertex-session-key");
    if(existing)return existing;
    const key=crypto.randomUUID()+crypto.randomUUID();
    window.localStorage.setItem("vertex-session-key",key);
    return key;
  }catch{return crypto.randomUUID()+crypto.randomUUID()}
}

export function GameVisitTracker({gameId}:{gameId:string}){
  const [supabase]=useState(()=>createClient());
  useEffect(()=>{
    const key=getKey();
    void supabase.rpc("vertex_record_game_visit",{p_game_id:gameId,p_session_key:key});
  },[gameId,supabase]);
  return null;
}
