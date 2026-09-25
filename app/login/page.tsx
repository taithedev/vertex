"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [supabase]=useState(()=>createClient());
  const router=useRouter();
  const [mode,setMode]=useState<"login"|"signup">("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[username,setUsername]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage("");
    if(mode==="login"){
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error)setMessage(error.message);else router.push("/");
    }else{
      const {data,error}=await supabase.auth.signUp({email,password,options:{data:{username:username.trim().toLowerCase(),display_name:username.trim()}}});
      if(error||!data.user)setMessage(error?.message??"Vertex could not create the account.");
      else{setMessage("Account created. Check your email if verification is enabled.");setMode("login");}
    }
    setBusy(false);
  }

  return <main className="page" style={{maxWidth:700}}>
    <div className="card pad" style={{padding:28}}>
      <div className="brand"><span className="brand-mark"><Sparkles size={18}/></span><span>Vertex</span></div>
      <h1 style={{fontSize:34,letterSpacing:"-.04em",margin:"22px 0 8px"}}>{mode==="login"?"Welcome back.":"Create your Vertex account."}</h1>
      <p className="meta" style={{lineHeight:1.6}}>Cookie-based sessions keep signed-in state available across the web app.</p>
      <form className="form" style={{marginTop:22}} onSubmit={submit}>
        {mode==="signup"&&<div className="field"><label className="label">Username</label><input className="input" required minLength={3} maxLength={24} pattern="[a-z0-9_]+" value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_name"/></div>}
        <div className="field"><label className="label">Email</label><input className="input" required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
        <div className="field"><label className="label">Password</label><input className="input" required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="8+ characters"/></div>
        {message&&<div className="card pad" style={{color:message.includes("created")?"#a7f3d0":"#fecdd3"}}>{message}</div>}
        <button className="btn primary" type="submit" disabled={busy}><LogIn size={17}/>{busy?"Working…":mode==="login"?"Sign in":"Create account"}</button>
      </form>
      <button className="btn ghost" style={{marginTop:10,width:"100%"}} onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Need an account? Sign up":"Already have an account? Sign in"}</button>
      <Link href="/" className="meta" style={{display:"block",textAlign:"center",marginTop:16}}>Back to Vertex</Link>
    </div>
  </main>;
}
