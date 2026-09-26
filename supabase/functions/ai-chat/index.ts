import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store"};
const json=(body:unknown,status=200,extra:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{...cors,...extra,"Content-Type":"application/json"}});

const SYSTEM=`You are Vertex AI, the official AI assistant inside the Vertex gaming platform.
Be helpful, accurate, concise, and practical. You can help with Vertex features, game development, coding, debugging, UI/UX, and general questions.
Never claim an action was performed unless the platform actually performed it.
Never ask for or expose passwords, API keys, service-role keys, OAuth secrets, tokens, or private credentials.
Do not reveal internal database secrets, private moderation data, staff-only information, or hidden security controls.
Vertex is a 12+ browser gaming platform using Supabase for its backend and Vercel for hosting.
Vertex includes accounts, Google/email authentication, profiles, avatars, games, Studio, Marketplace, friends, messages, notifications, moderation, analytics, matchmaking, and browser game runtimes.
Owner and staff actions are server-authorized and cannot be performed by simply asking the assistant.`;

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed."},405);
 try{
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))return json({error:"Sign in to use Vertex AI."},401);
  const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),groq=Deno.env.get("GROQ_API_KEY")||Deno.env.get("AI_API_KEY");
  if(!url||!service||!groq)return json({error:"Vertex AI is not configured on the server yet."},503);
  const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const token=auth.slice(7);
  const {data:ud,error:ue}=await admin.auth.getUser(token);
  if(ue||!ud.user)return json({error:"Your session is invalid. Sign in again."},401);
  let body:any={};try{body=await req.json()}catch{return json({error:"Request body must be valid JSON."},400)}
  const cid=typeof body.conversation_id==="string"?body.conversation_id:"";
  const prompt=typeof body.message==="string"?body.message.trim():"";
  if(!/^[0-9a-f-]{36}$/i.test(cid))return json({error:"Choose a valid AI conversation."},400);
  if(!prompt||prompt.length>8000)return json({error:"Messages must be between 1 and 8,000 characters."},400);
  const {data:conv}=await admin.from("ai_conversations").select("id,title").eq("id",cid).eq("user_id",ud.user.id).maybeSingle();
  if(!conv)return json({error:"Conversation not found."},404);
  const {data:allowed,error:limitError}=await admin.rpc("consume_ai_request",{p_user_id:ud.user.id});
  if(limitError)return json({error:"AI rate limiting is temporarily unavailable."},503);
  if(!allowed)return json({error:"You're sending messages too quickly or reached today's AI limit. Please wait a moment and try again."},429,{"Retry-After":"5"});
  const [{data:profile},{data:games}]=await Promise.all([
    admin.from("vertex_profiles").select("username,display_name").eq("user_id",ud.user.id).maybeSingle(),
    admin.from("vertex_games").select("title").eq("creator_id",ud.user.id).order("created_at",{ascending:false}).limit(8)
  ]);
  const {data:history,error:he}=await admin.from("ai_messages").select("role,content").eq("conversation_id",cid).eq("user_id",ud.user.id).order("created_at",{ascending:false}).limit(20);
  if(he)return json({error:"Could not load conversation history."},503);
  const context=`Current Vertex user: @${profile?.username||"player"} (${profile?.display_name||"Vertex Player"}). Their recent created games: ${(games||[]).map(g=>g.title).join(", ")||"none"}.`;
  const messages=[{role:"system",content:SYSTEM+"\n"+context},...(history||[]).reverse().map((m:any)=>({role:m.role,content:m.content})),{role:"user",content:prompt}];
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  let response:Response;
  try{response=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+groq,"Content-Type":"application/json"},body:JSON.stringify({model:Deno.env.get("VERTEX_AI_MODEL")||"openai/gpt-oss-120b",messages,temperature:.25,max_completion_tokens:1600}),signal:controller.signal})}catch{clearTimeout(timer);return json({error:"Vertex AI could not reach the AI provider. Try again shortly."},503)}
  clearTimeout(timer);
  if(response.status===429)return json({error:"The AI provider is busy. Try again shortly."},429,{"Retry-After":"30"});
  if(!response.ok)return json({error:"The AI provider returned an error. Check the Vertex AI server configuration."},502);
  let data:any;try{data=await response.json()}catch{return json({error:"The AI provider returned invalid JSON."},502)}
  const answer=data?.choices?.[0]?.message?.content;
  if(typeof answer!=="string"||!answer.trim())return json({error:"The AI provider returned an empty response."},502);
  if(answer.length>12000)return json({error:"The AI response was too long to save."},502);
  const ins=await admin.from("ai_messages").insert([{conversation_id:cid,user_id:ud.user.id,role:"user",content:prompt},{conversation_id:cid,user_id:ud.user.id,role:"assistant",content:answer}]);
  if(ins.error)return json({error:"The reply was generated but could not be saved."},503);
  const title=conv.title==="New conversation"?prompt.slice(0,80):conv.title;
  await admin.from("ai_conversations").update({title,updated_at:new Date().toISOString()}).eq("id",cid).eq("user_id",ud.user.id);
  return json({assistant:answer});
 }catch{return json({error:"Vertex AI encountered an unexpected server error."},500)}
});