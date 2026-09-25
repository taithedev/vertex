export const runtime="nodejs";

export async function GET(){
  const version=process.env.VERTEX_DESKTOP_VERSION;
  const url=process.env.VERTEX_DESKTOP_WINDOWS_URL;
  const signature=process.env.VERTEX_DESKTOP_WINDOWS_SIGNATURE;
  if(!version || !url)return Response.json({error:"Desktop release metadata is not configured."},{status:404,headers:{"Cache-Control":"no-store"}});
  return Response.json({
    version,
    notes:process.env.VERTEX_DESKTOP_RELEASE_NOTES??"Vertex desktop update",
    pub_date:process.env.VERTEX_DESKTOP_PUBLISHED_AT??new Date().toISOString(),
    platforms:{
      "windows-x86_64":{
        signature:signature??"",
        url
      }
    }
  },{headers:{"Cache-Control":"public, max-age=300"}});
}
