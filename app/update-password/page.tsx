"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage(){
  const [supabase]=useState(()=>createClient());
  const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    if(password.length<8){setMessage("Use at least 8 characters.");setBusy(false);return}
    if(password!==confirm){setMessage("The passwords do not match.");setBusy(false);return}
    const {error}=await supabase.auth.updateUser({password});
    if(error)setMessage(error.message);else{setDone(true);setMessage("Your password was updated.");}
    setBusy(false);
  }
  return <main className="page" style={{maxWidth:700}}>
    <div className="card pad" style={{padding:28}}>
      <div className="stack" style={{alignItems:"center"}}><span className="brand-mark"><KeyRound size={18}/></span><div><div className="kicker">Account recovery</div><h1 style={{fontSize:34,letterSpacing:"-.04em",margin:"5px 0 0"}}>Choose a new password.</h1></div></div>
      <p className="meta" style={{lineHeight:1.7,marginTop:14}}>This page is only useful after arriving from a valid Supabase recovery session.</p>
      {done?<div className="card empty" style={{marginTop:20}}><div className="empty-icon"><CheckCircle2 size={20}/></div><h3>Password updated</h3><Link href="/login" className="btn primary" style={{marginTop:16}}>Sign in</Link></div>:
      <form className="form" style={{marginTop:20}} onSubmit={submit}>
        <div className="field"><label className="label">New password</label><input className="input" required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
        <div className="field"><label className="label">Confirm password</label><input className="input" required minLength={8} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>
        {message&&<div className="card pad meta">{message}</div>}
        <button className="btn primary" disabled={busy} type="submit"><Sparkles size={16}/>{busy?"Updating…":"Update password"}</button>
      </form>}
    </div>
  </main>;
}
