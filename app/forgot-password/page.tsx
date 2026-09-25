"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage(){
  const [supabase]=useState(()=>createClient());
  const [email,setEmail]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    const origin=window.location.origin;
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:origin+"/update-password"});
    setMessage(error?error.message:"If that email is registered, a password-reset email has been sent.");
    setBusy(false);
  }
  return <main className="page" style={{maxWidth:700}}>
    <div className="card pad" style={{padding:28}}>
      <Link href="/login" className="btn sm ghost"><ArrowLeft size={14}/>Back to sign in</Link>
      <div className="stack" style={{alignItems:"center",marginTop:24}}><span className="brand-mark"><KeyRound size={18}/></span><div><div className="kicker">Account recovery</div><h1 style={{fontSize:34,letterSpacing:"-.04em",margin:"5px 0 0"}}>Reset your password.</h1></div></div>
      <p className="meta" style={{lineHeight:1.7,marginTop:14}}>Enter your account email. Vertex does not reveal whether an account exists for a given address.</p>
      <form className="form" style={{marginTop:20}} onSubmit={submit}>
        <div className="field"><label className="label">Email</label><input className="input" required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
        {message&&<div className="card pad meta">{message}</div>}
        <button className="btn primary" disabled={busy} type="submit"><Sparkles size={16}/>{busy?"Sending…":"Send reset email"}</button>
      </form>
    </div>
  </main>;
}
