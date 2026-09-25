"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Comment={id:string;user_id:string;content:string;created_at:string};

export function GameComments({gameId}:{gameId:string}){
  const [supabase]=useState(()=>createClient());
  const router=useRouter();
  const [comments,setComments]=useState<Comment[]>([]),[draft,setDraft]=useState(""),[userId,setUserId]=useState(""),[error,setError]=useState("");

  useEffect(()=>{
    let cancelled=false;
    const run=async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      const {data}=await supabase.from("vertex_game_comments").select("id,user_id,content,created_at").eq("game_id",gameId).eq("moderation_state","visible").order("created_at",{ascending:false}).limit(50);
      if(cancelled)return;
      if(user)setUserId(user.id);
      setComments(data??[]);
    };
    void run();
    const channel=supabase.channel("vertex-comments-"+gameId).on("postgres_changes",{event:"INSERT",schema:"public",table:"vertex_game_comments",filter:"game_id=eq."+gameId},payload=>setComments(prev=>[payload.new as Comment,...prev])).subscribe();
    return()=>{cancelled=true;void supabase.removeChannel(channel)};
  },[gameId,supabase]);

  async function send(e:FormEvent){
    e.preventDefault();setError("");
    if(!userId){router.push("/login");return}
    const content=draft.trim();if(!content)return;
    const {error}=await supabase.from("vertex_game_comments").insert({game_id:gameId,user_id:userId,content});
    if(error)setError(error.message);else setDraft("");
  }

  return <section className="card pad">
    <div className="section-head"><div><h2 className="section-title"><MessageCircle size={17} style={{verticalAlign:"-3px"}}/> Comments</h2><p className="section-copy">Community discussion for this published world.</p></div></div>
    <form className="stack" onSubmit={send}><input className="input" value={draft} maxLength={1000} onChange={e=>setDraft(e.target.value)} placeholder="Leave a respectful comment…" /><button className="btn primary" type="submit"><Send size={14}/>Post</button></form>
    {error&&<p className="meta" style={{color:"#fecdd3"}}>{error}</p>}
    <div className="grid" style={{gap:8,marginTop:14}}>{comments.length?comments.map(c=><div key={c.id} className="card pad"><p style={{margin:"0 0 5px"}}>{c.content}</p><span className="meta">{c.user_id===userId?"You":"Vertex player"} · {new Date(c.created_at).toLocaleString()}</span></div>):<p className="meta">No comments yet.</p>}</div>
  </section>;
}
