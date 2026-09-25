"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileImage, FolderOpen, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Asset={name:string;updated_at:string|null;id:string|null};

export default function AssetsPage(){
  const [supabase]=useState(()=>createClient());
  const router=useRouter();
  const [assets,setAssets]=useState<Asset[]>([]),[userId,setUserId]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  useEffect(()=>{
    let cancelled=false;
    const run=async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");return}
      const {data}=await supabase.storage.from("game-assets").list(user.id,{limit:100,sortBy:{column:"updated_at",order:"desc"}});
      if(cancelled)return;
      setUserId(user.id);
      setAssets((data??[]).map(x=>({name:x.name,updated_at:x.updated_at,id:x.id})));
    };
    void run();
    return()=>{cancelled=true};
  },[router,supabase]);
  async function upload(file:File){
    setBusy(true);setMessage("");
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path=userId+"/"+Date.now()+"-"+safe;
    const {error}=await supabase.storage.from("game-assets").upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});
    setMessage(error?error.message:"Asset uploaded.");
    if(!error){
      const {data}=await supabase.storage.from("game-assets").list(userId,{limit:100,sortBy:{column:"updated_at",order:"desc"}});
      setAssets((data??[]).map(x=>({name:x.name,updated_at:x.updated_at,id:x.id})));
    }
    setBusy(false);
  }
  return <main className="page" style={{maxWidth:1050}}>
    <Link href="/studio" className="btn sm ghost"><ArrowLeft size={14}/>Studio</Link>
    <div className="section-head" style={{marginTop:14}}>
      <div><div className="kicker">Creator assets</div><h1 style={{fontSize:40,letterSpacing:"-.05em",margin:"7px 0"}}>Asset vault</h1><p className="section-copy">Private storage for creator-owned files. Game creation remains intentionally paused.</p></div>
      <label className="btn primary"><Upload size={15}/>{busy?"Uploading…":"Upload asset"}<input type="file" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}} disabled={busy}/></label>
    </div>
    {message&&<div className="card pad meta">{message}</div>}
    <section className="section"><div className="grid grid-4">{assets.length?assets.map(a=><div key={a.name} className="card pad"><div className="empty-icon" style={{margin:0}}><FileImage size={18}/></div><h3 style={{fontSize:14,margin:"10px 0 4px",wordBreak:"break-word"}}>{a.name}</h3><p className="meta">{a.updated_at?new Date(a.updated_at).toLocaleString():"Uploaded asset"}</p></div>):<div className="card empty" style={{gridColumn:"1/-1"}}><div className="empty-icon"><FolderOpen size={20}/></div><h3>No assets yet</h3><p className="meta">Upload private files for future published games.</p></div>}</div></section>
  </main>;
}
