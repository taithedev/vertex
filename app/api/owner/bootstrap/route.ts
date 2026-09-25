import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const runtime="nodejs";

export async function POST(){
  const server=await createServerClient();
  const {data:{user}}=await server.auth.getUser();
  if(!user || !user.email)return Response.json({error:"Authentication is required."},{status:401});

  const ownerEmail=process.env.VERTEX_OWNER_EMAIL;
  const secret=process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(!ownerEmail || !secret || !supabaseUrl)return Response.json({error:"Owner bootstrap is not configured on this deployment."},{status:503});
  if(user.email.toLowerCase()!==ownerEmail.toLowerCase())return Response.json({error:"This account is not configured as the Vertex owner."},{status:403});

  const admin=createAdminClient(supabaseUrl,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:existing}=await admin.from("vertex_staff_roles").select("user_id").eq("role","owner").limit(1);
  if(existing?.length)return Response.json({error:"Vertex already has an owner account."},{status:409});

  const capabilities=["view_reports","review_games","moderate_users","mute_users","suspend_users","ban_users","manage_announcements","inspect_moderation_logs","manage_staff","manage_marketplace","manage_economy","manage_platform"];
  const {error}=await admin.from("vertex_staff_roles").insert({user_id:user.id,role:"owner",capabilities});
  if(error)return Response.json({error:error.message},{status:500});
  return Response.json({ok:true,role:"owner"});
}
