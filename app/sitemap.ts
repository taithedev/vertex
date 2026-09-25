import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base=process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["/","/discover","/search","/marketplace","/login","/create","/studio"].map(path=>({url:base+path,lastModified:new Date()}));
}
