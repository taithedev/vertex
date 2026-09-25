"use client";

import { useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MatchmakingButton({gameId}:{gameId:string}){
  const [supabase]=useState(()=>createClient());
  const [busy,setBusy]=useState(false),[queued,setQueued]=useState(false),[message,setMessage]=useState("");
  async function find(){
    setBusy(true);setMessage("");
    const {data,error}=await supabase.rpc("vertex_find_game_session",{p_game_id:gameId,p_region:"nearest"});
    if(error){setMessage(error.message)}else if(data?.matched){setMessage("A live game session is ready.");setQueued(false)}else{setMessage("Queued. A live session will be assigned when one is available.");setQueued(true)}
    setBusy(false);
  }
  async function cancel(){
    setBusy(true);const {error}=await supabase.rpc("vertex_cancel_matchmaking");setMessage(error?error.message:"Matchmaking cancelled.");setQueued(false);setBusy(false);
  }
  return <div className="stack" style={{alignItems:"center"}}>{queued?<button className="btn sm" onClick={cancel} disabled={busy}><X size={14}/>Cancel queue</button>:<button className="btn sm primary" onClick={find} disabled={busy}><Search size={14}/>{busy?<><LoaderCircle size={14} className="spin"/>Finding…</>:"Find a server"}</button>}{message&&<span className="meta">{message}</span>}</div>;
}
