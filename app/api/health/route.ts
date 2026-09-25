import { createClient } from "@/lib/supabase/server";

export const runtime="nodejs";

export async function GET(){
  try{
    const supabase=await createClient();
    const {error}=await supabase.from("vertex_platform_settings").select("site_name").eq("id",true).maybeSingle();
    return Response.json({status:error?"degraded":"ok",database:error?"error":"ok",timestamp:new Date().toISOString()},{status:error?503:200});
  }catch(error){
    return Response.json({status:"degraded",database:"not_configured",message:error instanceof Error?error.message:"Supabase is not configured."},{status:503});
  }
}
