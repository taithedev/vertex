import Link from "next/link";
import { ArrowLeft, CircleOff } from "lucide-react";

export default function NotFound(){
  return <main className="page" style={{maxWidth:760}}><div className="card empty"><div className="empty-icon"><CircleOff size={20}/></div><h1 style={{fontSize:40,letterSpacing:"-.04em"}}>That world does not exist.</h1><p className="meta">The requested Vertex page could not be found.</p><Link className="btn primary" href="/"><ArrowLeft size={15}/>Back to Vertex</Link></div></main>;
}
