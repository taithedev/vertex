import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 try{
  const h=req.headers.get("Authorization")||"";if(!h.startsWith("Bearer "))return json({error:"Authentication required."},401);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return json({error:"Owner service is not configured."},503);
  const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:u,error:ue}=await admin.auth.getUser(h.slice(7));if(ue||!u.user)return json({error:"Invalid session."},401);
  const actor=u.user.id;
  const {data:role}=await admin.from("vertex_staff_roles").select("role,capabilities").eq("user_id",actor).maybeSingle();
  if(role?.role!=="owner")return json({error:"Owner access required."},403);
  let body:any={};try{body=await req.json()}catch{return json({error:"Invalid JSON."},400)}
  const action=String(body.action||"");
  if(action==="stats"){
   const [{count:users},{count:profiles},{count:published_games},{count:pending_games},{count:open_reports},{count:staff},{data:coinRows},{data:settings}]=await Promise.all([
    admin.from("vertex_profiles").select("user_id",{count:"exact",head:true}),admin.from("vertex_profiles").select("user_id",{count:"exact",head:true}),
    admin.from("vertex_games").select("id",{count:"exact",head:true}).eq("status","published"),admin.from("vertex_games").select("id",{count:"exact",head:true}).eq("status","pending_review"),
    admin.from("vertex_reports").select("id",{count:"exact",head:true}).in("status",["open","reviewing"]),admin.from("vertex_staff_roles").select("user_id",{count:"exact",head:true}).neq("role","owner"),
    admin.from("vertex_currency_accounts").select("balance"),admin.from("vertex_platform_settings").select("maintenance_mode").eq("id",true).maybeSingle()
   ]);
   return json({users:users||0,profiles:profiles||0,published_games:published_games||0,pending_games:pending_games||0,open_reports:open_reports||0,staff:staff||0,coins:(coinRows||[]).reduce((a,r)=>a+Number(r.balance||0),0),maintenance:!!settings?.maintenance_mode});
  }
  if(action==="users"){
   const search=String(body.search||"").trim().toLowerCase(),limit=Math.max(1,Math.min(100,Number(body.limit||100)));
   const {data:profiles,error}=await admin.from("vertex_profiles").select("user_id,username,display_name,avatar_url").order("created_at",{ascending:false}).limit(1000);
   if(error)return json({error:error.message},500);
   const ids=(profiles||[]).map(p=>p.user_id);let authMap=new Map<string,any>();if(ids.length){const {data:au}=await admin.auth.admin.listUsers({page:1,perPage:1000});for(const x of au?.users||[])authMap.set(x.id,x)}
   const {data:mods}=await admin.from("vertex_user_moderation").select("user_id,status");const modMap=new Map((mods||[]).map(x=>[x.user_id,x.status]));
   const {data:staffRows}=await admin.from("vertex_staff_roles").select("user_id,role");const staffMap=new Map((staffRows||[]).map(x=>[x.user_id,x.role]));
   const {data:coins}=await admin.from("vertex_currency_accounts").select("user_id,balance");const coinMap=new Map((coins||[]).map(x=>[x.user_id,x.balance]));
   let out=(profiles||[]).map(p=>{const a=authMap.get(p.user_id);return {...p,email:a?.email||"",moderation_status:modMap.get(p.user_id)||"active",staff_role:staffMap.get(p.user_id)||"player",balance:Number(coinMap.get(p.user_id)||0)}}).filter(x=>!search||x.username?.toLowerCase().includes(search)||x.display_name?.toLowerCase().includes(search)||x.email?.toLowerCase().includes(search)).slice(0,limit);
   return json({users:out});
  }
  if(action==="moderate"){const target=String(body.user_id||"");const state=String(body.status||"");if(!target||!["active","suspended","banned"].includes(state))return json({error:"Invalid moderation request."},400);const {error}=await admin.from("vertex_user_moderation").upsert({user_id:target,status:state,reason:String(body.reason||"Owner action").slice(0,500),note:"Owner Console",updated_by:actor,updated_at:new Date().toISOString()});if(error)return json({error:error.message},500);await admin.from("vertex_audit_logs").insert({actor_id:actor,action:"owner.user_moderation",target_type:"user",target_id:target,metadata:{status:state}});return json({ok:true});}
  if(action==="coins"){const target=String(body.user_id||""),delta=Number(body.delta);if(!target||!Number.isInteger(delta)||delta===0||Math.abs(delta)>1000000)return json({error:"Invalid coin adjustment."},400);const {data:acct}=await admin.from("vertex_currency_accounts").select("balance").eq("user_id",target).maybeSingle();const next=Number(acct?.balance||0)+delta;if(next<0)return json({error:"Balance cannot go below zero."},400);const {error}=await admin.from("vertex_currency_accounts").upsert({user_id:target,balance:next,updated_at:new Date().toISOString()});if(error)return json({error:error.message},500);await admin.from("vertex_currency_transactions").insert({user_id:target,delta,reason:String(body.reason||"Owner adjustment").slice(0,200),reference_type:"owner"});await admin.from("vertex_audit_logs").insert({actor_id:actor,action:"owner.currency_adjustment",target_type:"user",target_id:target,metadata:{delta}});return json({ok:true,balance:next});}
  if(action==="role"){const target=String(body.user_id||""),r=String(body.role||"");if(!target||!["staff","moderator","admin"].includes(r))return json({error:"Invalid staff role."},400);const {error}=await admin.from("vertex_staff_roles").upsert({user_id:target,role:r,capabilities:Array.isArray(body.capabilities)?body.capabilities:[],updated_at:new Date().toISOString()});if(error)return json({error:error.message},500);await admin.from("vertex_audit_logs").insert({actor_id:actor,action:"owner.staff_role",target_type:"user",target_id:target,metadata:{role:r}});return json({ok:true});}
  if(action==="games"){const {data,error}=await admin.from("vertex_games").select("id,creator_id,title,slug,status,genre,age_rating,visits_count,likes_count,favorites_count,created_at,updated_at").order("updated_at",{ascending:false}).limit(200);if(error)return json({error:error.message},500);return json({games:data||[]});}
  if(action==="game_status"){const id=String(body.game_id||""),state=String(body.status||"");if(!id||!["draft","pending_review","published","paused","declined","removed"].includes(state))return json({error:"Invalid game status."},400);const {error}=await admin.from("vertex_games").update({status:state,published_at:state==="published"?new Date().toISOString():undefined,updated_at:new Date().toISOString()}).eq("id",id);if(error)return json({error:error.message},500);await admin.from("vertex_audit_logs").insert({actor_id:actor,action:"owner.game_status",target_type:"game",target_id:id,metadata:{status:state}});return json({ok:true});}
  if(action==="reports"){const {data,error}=await admin.from("vertex_reports").select("id,reporter_id,target_type,target_id,reason,severity,status,assigned_to,created_at").order("created_at",{ascending:false}).limit(200);if(error)return json({error:error.message},500);return json({reports:data||[]});}
  if(action==="report_status"){const id=String(body.report_id||""),state=String(body.status||"");if(!id||!["open","reviewing","resolved","dismissed"].includes(state))return json({error:"Invalid report status."},400);const {error}=await admin.from("vertex_reports").update({status:state,assigned_to:actor,resolved_at:["resolved","dismissed"].includes(state)?new Date().toISOString():null}).eq("id",id);if(error)return json({error:error.message},500);await admin.from("vertex_audit_logs").insert({actor_id:actor,action:"owner.report_status",target_type:"report",target_id:id,metadata:{status:state}});return json({ok:true});}
  if(action==="platform_get"){const {data,error}=await admin.from("vertex_platform_settings").select("site_name,announcement,maintenance_mode,theme").eq("id",true).single();if(error)return json({error:error.message},500);return json({settings:data});}
  if(action==="platform_set"){const {error}=await admin.from("vertex_platform_settings").update({site_name:String(body.site_name||"Vertex").slice(0,80),announcement:String(body.announcement||"").slice(0,1000)||null,maintenance_mode:!!body.maintenance,theme:String(body.theme||"vertex-dark").slice(0,80),updated_at:new Date().toISOString()}).eq("id",true);if(error)return json({error:error.message},500);await admin.from("vertex_audit_logs").insert({actor_id:actor,action:"owner.platform_settings",target_type:"platform",metadata:{maintenance:!!body.maintenance}});return json({ok:true});}
  return json({error:"Unknown owner action."},400);
 }catch(e){return json({error:e instanceof Error?e.message:"Owner service error."},500)}
});