"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

export default function CreatePage() {
  const router = useRouter();
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [genre,setGenre]=useState("Other");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){ router.push("/login"); return; }
    const base=slugify(title);
    const slug=base || `world-${Date.now()}`;
    const {data,error}=await supabase.from("vertex_games").insert({
      creator_id:user.id,title:title.trim(),slug,description:description.trim(),genre,
      runtime_config:{world:"starter",spawn:[0,1,6],version:"0.1.0"}
    }).select("id").single();
    if(error || !data){ setError(error?.message ?? "Vertex could not create the game."); setBusy(false); return; }
    await supabase.from("vertex_game_members").insert({game_id:data.id,user_id:user.id,role:"owner"});
    await supabase.from("vertex_game_versions").insert({game_id:data.id,version:"0.1.0",runtime_config:{world:"starter",spawn:[0,1,6]},created_by:user.id});
    router.push(`/studio?game=${data.id}`);
  }

  return <main className="page" style={{maxWidth:900}}>
    <Link href="/studio" className="btn sm ghost"><ArrowLeft size={14}/>Back to Studio</Link>
    <section className="hero" style={{marginTop:14}}>
      <div className="kicker">New project</div>
      <h1 style={{fontSize:42,letterSpacing:"-.045em",margin:"8px 0"}}>Create your first world.</h1>
      <p className="sub" style={{fontSize:15}}>Vertex starts every project with a real version record and a browser-runtime configuration.</p>
      <form className="form" style={{marginTop:24}} onSubmit={submit}>
        <div className="grid grid-2">
          <div className="field"><label className="label">Game name</label><input className="input" required maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Neon District"/></div>
          <div className="field"><label className="label">Genre</label><select className="select" value={genre} onChange={e=>setGenre(e.target.value)}>{["Adventure","Building","Casual","Racing","Roleplay","Simulation","Social","Other"].map(x=><option key={x}>{x}</option>)}</select></div>
        </div>
        <div className="field"><label className="label">Description</label><textarea className="textarea" maxLength={5000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell players what makes this world worth playing." /></div>
        {error && <div className="card pad" style={{color:"#fecdd3"}}>{error}</div>}
        <div className="stack">
          <button className="btn primary" disabled={busy} type="submit"><Sparkles size={16}/>{busy?"Creating…":"Create project"}</button>
          <span className="pill"><ImagePlus size={13}/>Assets can be added from Studio</span>
        </div>
      </form>
    </section>
  </main>;
}
