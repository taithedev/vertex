export default function Loading(){
  return <main className="page"><div className="hero"><div className="kicker">Vertex</div><h1 className="display" style={{maxWidth:700}}>Loading your worlds…</h1><div className="grid grid-4" style={{marginTop:28}}>{[1,2,3,4].map(x=><div key={x} className="card" style={{height:220,opacity:.65}}/>)}</div></div></main>;
}
