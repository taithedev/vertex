"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function GameActions({ gameId }: { gameId:string }) {
  const [supabase]=useState(()=>createClient());
  const router=useRouter();
  const [signedIn,setSignedIn]=useState(false),[liked,setLiked]=useState(false),[favorite,setFavorite]=useState(false);
  useEffect(()=>{void (async()=>{
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    setSignedIn(true);
    const [{data:l},{data:f}]=await Promise.all([
      supabase.from("vertex_game_likes").select("game_id").eq("game_id",gameId).eq("user_id",user.id).maybeSingle(),
      supabase.from("vertex_game_favorites").select("game_id").eq("game_id",gameId).eq("user_id",user.id).maybeSingle()
    ]);
    setLiked(Boolean(l));setFavorite(Boolean(f));
  })()},[gameId,supabase]);
  async function toggle(kind:"like"|"favorite"){
    if(!signedIn){router.push("/login");return}
    const table=kind==="like"?"vertex_game_likes":"vertex_game_favorites",active=kind==="like"?liked:favorite;
    if(active)await supabase.from(table).delete().eq("game_id",gameId);
    else{const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.from(table).insert({game_id:gameId,user_id:user.id})}
    if(kind==="like")setLiked(!active);else setFavorite(!active);
  }
  return <div className="stack">
    <button className={"btn sm "+(liked?"primary":"")} onClick={()=>toggle("like")} aria-pressed={liked}><Heart size={14}/>{liked?"Liked":"Like"}</button>
    <button className={"btn sm "+(favorite?"primary":"")} onClick={()=>toggle("favorite")} aria-pressed={favorite}><Star size={14}/>{favorite?"Favorited":"Favorite"}</button>
  </div>;
}
