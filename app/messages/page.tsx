"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Conversation={id:string;title:string|null;created_by:string};
type Message={id:string;conversation_id:string;sender_id:string;content:string;created_at:string};

export default function MessagesPage(){
  const [supabase]=useState(()=>createClient());
  const router=useRouter();
  const [userId,setUserId]=useState(""),[convos,setConvos]=useState<Conversation[]>([]),[selected,setSelected]=useState(""),[messages,setMessages]=useState<Message[]>([]),[target,setTarget]=useState(""),[draft,setDraft]=useState(""),[status,setStatus]=useState("");

  useEffect(()=>{
    let cancelled=false;
    const run=async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");return}
      const {data}=await supabase.from("vertex_conversations").select("id,title,created_by").order("created_at",{ascending:false});
      if(cancelled)return;
      setUserId(user.id);setConvos(data??[]);
      if(!selected && data?.[0])setSelected(data[0].id);
    };
    void run();
    return()=>{cancelled=true};
  },[router,selected,supabase]);

  useEffect(()=>{
    if(!selected)return;
    let cancelled=false;
    const run=async()=>{
      const {data}=await supabase.from("vertex_messages").select("id,conversation_id,sender_id,content,created_at").eq("conversation_id",selected).order("created_at",{ascending:true});
      if(!cancelled)setMessages(data??[]);
    };
    void run();
    return()=>{cancelled=true};
  },[selected,supabase]);

  useEffect(()=>{
    if(!selected)return;
    const channel=supabase.channel("vertex-messages-"+selected)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"vertex_messages",filter:"conversation_id=eq."+selected},payload=>setMessages(prev=>[...prev,payload.new as Message]))
      .subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[selected,supabase]);

  async function startConversation(e:FormEvent){
    e.preventDefault();setStatus("");
    const name=target.trim().replace(/^@/,"").toLowerCase();if(!name)return;
    const {data:person}=await supabase.from("vertex_profiles").select("user_id,display_name").eq("username",name).maybeSingle();
    if(!person){setStatus("That Vertex username was not found.");return}
    if(person.user_id===userId){setStatus("You cannot start a conversation with yourself.");return}
    const {data:conversation,error}=await supabase.from("vertex_conversations").insert({created_by:userId}).select("id").single();
    if(error||!conversation){setStatus(error?.message??"Could not create the conversation.");return}
    const {error:memberError}=await supabase.from("vertex_conversation_members").insert([{conversation_id:conversation.id,user_id:userId},{conversation_id:conversation.id,user_id:person.user_id}]);
    if(memberError){setStatus(memberError.message);return}
    setTarget("");setSelected(conversation.id);
  }

  async function send(e:FormEvent){
    e.preventDefault();
    if(!draft.trim()||!selected)return;
    const content=draft.trim();setDraft("");
    const {error}=await supabase.from("vertex_messages").insert({conversation_id:selected,sender_id:userId,content});
    if(error)setStatus(error.message);
  }

  return <main className="page">
    <Link href="/" className="btn sm ghost"><ArrowLeft size={14}/>Home</Link>
    <div className="section-head" style={{marginTop:14}}><div><div className="kicker">Social</div><h1 style={{fontSize:38,letterSpacing:"-.04em",margin:"7px 0 0"}}>Messages</h1></div></div>
    <div className="card" style={{display:"grid",gridTemplateColumns:"280px 1fr",minHeight:560,overflow:"hidden"}}>
      <aside style={{borderRight:"1px solid var(--line)",padding:14}}>
        <form onSubmit={startConversation} className="stack" style={{marginBottom:12}}><input className="input" value={target} onChange={e=>setTarget(e.target.value)} placeholder="@username" aria-label="Username"/><button className="btn sm primary" type="submit">Start</button></form>
        {status&&<div className="meta" style={{margin:"8px 0 12px",color:"#fecdd3"}}>{status}</div>}
        {convos.length?convos.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className={"side-link "+(selected===c.id?"active":"")} style={{width:"100%",textAlign:"left",border:0,background:"transparent"}}><MessageCircle size={16}/>{c.title??"Direct conversation"}</button>):<div className="empty" style={{padding:"28px 10px"}}><p className="meta">No conversations yet.</p></div>}
      </aside>
      <section style={{display:"grid",gridTemplateRows:"1fr auto"}}>
        <div style={{padding:18,overflow:"auto",display:"grid",gap:10,alignContent:"start"}}>{selected&&messages.length?messages.map(m=><div key={m.id} style={{justifySelf:m.sender_id===userId?"end":"start",maxWidth:"75%"}}><div className="card pad" style={{background:m.sender_id===userId?"rgba(168,85,247,.12)":"rgba(255,255,255,.035)"}}>{m.content}</div><div className="meta" style={{fontSize:10,marginTop:3}}>{new Date(m.created_at).toLocaleTimeString()}</div></div>):<div className="empty"><div className="empty-icon"><MessageCircle size={20}/></div><h3>Select a conversation</h3><p className="meta">Messages are stored in Vertex and update through Realtime.</p></div>}</div>
        <form onSubmit={send} className="stack" style={{padding:14,borderTop:"1px solid var(--line)"}}><input className="input" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a message…" disabled={!selected}/><button className="btn primary" type="submit" disabled={!selected||!draft.trim()}><Send size={15}/>Send</button></form>
      </section>
    </div>
  </main>;
}
