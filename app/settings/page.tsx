"use client";

import { useEffect, useState } from "react";
import { LogOut, Save, Settings2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemePicker } from "@/components/theme-picker";

export default function SettingsPage() {
  const supabase=createClient();
  const [profile,setProfile]=useState<{username:string;display_name:string;bio:string;avatar_url:string|null} | null>(null);
  const [displayName,setDisplayName]=useState(""),[bio,setBio]=useState(""),[avatar,setAvatar]=useState(""),[email,setEmail]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);

  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/login";return}
    setEmail(user.email ?? "");
    const {data}=await supabase.from("vertex_profiles").select("username,display_name,bio,avatar_url").eq("user_id",user.id).single();
    if(data){setProfile(data);setDisplayName(data.display_name);setBio(data.bio);setAvatar(data.avatar_url??"")}
  })()},[]);

  async function save(){
    setBusy(true);setMessage("");
    const {error}=await supabase.rpc("vertex_update_own_profile",{p_display_name:displayName,p_bio:bio,p_avatar_url:avatar||null});
    setMessage(error?error.message:"Profile saved.");setBusy(false);
  }
  async function signOut(){await supabase.auth.signOut();window.location.href="/";}
  if(!profile)return <main className="page"><div className="card empty">Loading settings…</div></main>;

  return <main className="page" style={{maxWidth:1000}}>
    <div className="section-head"><div><div className="kicker">Account</div><h1 style={{fontSize:38,letterSpacing:"-.04em",margin:"7px 0 0"}}>Settings</h1><p className="section-copy">Profile, privacy, appearance, security, and sessions.</p></div><Link href={"/profile/"+profile.username} className="btn sm">View profile</Link></div>
    <div className="grid grid-2">
      <section className="card pad"><div className="stack" style={{alignItems:"center"}}><Settings2 size={18}/><h2 className="section-title" style={{fontSize:16}}>Profile</h2></div><div className="form" style={{marginTop:18}}>
        <div className="field"><label className="label">Email</label><input className="input" value={email} disabled/></div>
        <div className="field"><label className="label">Username</label><input className="input" value={profile.username} disabled/></div>
        <div className="field"><label className="label">Display name</label><input className="input" maxLength={40} value={displayName} onChange={e=>setDisplayName(e.target.value)}/></div>
        <div className="field"><label className="label">Bio</label><textarea className="textarea" maxLength={280} value={bio} onChange={e=>setBio(e.target.value)}/></div>
        <div className="field"><label className="label">Avatar URL</label><input className="input" value={avatar} onChange={e=>setAvatar(e.target.value)} placeholder="https://…"/></div>
        {message&&<div className="card pad meta">{message}</div>}
        <button className="btn primary" onClick={save} disabled={busy}><Save size={15}/>{busy?"Saving…":"Save profile"}</button>
      </div></section>
      <section className="card pad">
        <h2 className="section-title" style={{fontSize:16}}>Appearance</h2>
        <p className="meta" style={{lineHeight:1.7,marginTop:8}}>Vertex themes use centralized design tokens so the same surfaces, spacing, and components stay consistent.</p>
        <div style={{marginTop:18}}><ThemePicker/></div>
        <div className="stack" style={{marginTop:22}}><Link className="btn" href="/notifications">Notifications</Link><button className="btn danger" onClick={signOut}><LogOut size={15}/>Sign out</button></div>
      </section>
    </div>
  </main>;
}
