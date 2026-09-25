import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceBuy } from "@/components/marketplace-buy";

export const dynamic="force-dynamic";

export default async function MarketplacePage() {
  const supabase=await createClient();
  const [{data:items},{data:{user}}]=await Promise.all([
    supabase.from("vertex_marketplace_items").select("id,name,description,category,price,image_url,creator_id,status").eq("status","published").order("created_at",{ascending:false}).limit(60),
    supabase.auth.getUser()
  ]);
  return <main className="page">
    <div className="section-head"><div><div className="kicker">Vertex economy</div><h1 style={{fontSize:40,letterSpacing:"-.05em",margin:"7px 0 0"}}>Marketplace</h1><p className="section-copy">Original cosmetics and creator items. Purchases use a server-authorized database transaction.</p></div><span className="pill"><ShoppingBag size={13}/>Inventory-ready</span></div>
    {items?.length ? <div className="grid grid-4">{items.map(item=><article key={item.id} className="card game-card"><div className="game-cover" style={{display:"grid",placeItems:"center",background:"radial-gradient(circle at 50% 20%,rgba(168,85,247,.2),transparent 55%),#100c17"}}>{item.image_url?<img src={item.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<ShoppingBag size={34} color="#c084fc"/>}</div><div className="game-body"><span className="pill">{item.category}</span><h2 className="game-title" style={{marginTop:8}}>{item.name}</h2><p className="meta" style={{minHeight:38}}>{item.description}</p><div className="section-head" style={{marginTop:14,alignItems:"center"}}><strong>{item.price===0?"Free":item.price+" Vertex"}</strong><MarketplaceBuy itemId={item.id} price={item.price} signedIn={Boolean(user)}/></div></div></article>)}</div>:<div className="card empty"><div className="empty-icon"><ShoppingBag size={20}/></div><h3>No marketplace items yet</h3><p className="meta">Creators can publish original cosmetics when the catalog is ready.</p></div>}
    <div className="section"><Link className="btn sm" href="/studio">Create a game</Link></div>
  </main>;
}
