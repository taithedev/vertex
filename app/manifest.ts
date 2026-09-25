import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name:"Vertex", short_name:"Vertex", description:"Play and create original worlds.", start_url:"/", display:"standalone", background_color:"#07060b", theme_color:"#7c3aed" };
}
