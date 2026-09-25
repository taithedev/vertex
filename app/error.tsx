"use client";

export default function Error({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <main className="page" style={{maxWidth:760}}><div className="card empty"><div className="empty-icon">!</div><h1 style={{fontSize:34}}>Vertex hit an unexpected error.</h1><p className="meta">The page failed to render. Retry without hiding the underlying failure.</p><button className="btn primary" style={{marginTop:16}} onClick={()=>reset()}>Try again</button></div></main>;
}
