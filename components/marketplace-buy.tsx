"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MarketplaceBuy({ itemId, price, signedIn }: { itemId:string; price:number; signedIn:boolean }) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function buy(){
    setBusy(true);setMessage("");
    const supabase=createClient();
    const {data,error}=await supabase.rpc("vertex_purchase_item",{p_item_id:itemId});
    setMessage(error ? error.message : data?.owned ? (price===0?"Added to inventory.":"Purchase complete.") : "Purchase complete.");
    setBusy(false);
  }
  if(!signedIn)return <span className="pill"><ShoppingBag size={13}/>Sign in to purchase</span>;
  return <div className="stack" style={{alignItems:"center"}}><button className="btn primary" onClick={buy} disabled={busy}><ShoppingBag size={15}/>{busy?"Processing…":price===0?"Get item":"Buy for "+price}</button>{message&&<span className="meta">{message}</span>}</div>;
}
