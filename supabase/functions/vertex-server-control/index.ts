import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});

Deno.serve(async (req)=>{
  if(req.method!=="POST")return json({error:"Method not allowed."},405);
  const expected=Deno.env.get("VERTEX_GAME_SERVER_KEY");
  const supplied=req.headers.get("x-vertex-server-key");
  if(!expected || !supplied || supplied!==expected)return json({error:"Unauthorized server request."},401);

  const supabaseUrl=Deno.env.get("SUPABASE_URL");
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl || !serviceKey)return json({error:"Server control is not configured."},503);

  const {createClient}=await import("npm:@supabase/supabase-js@2.117.1");
  const admin=createClient(supabaseUrl,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});

  let body:{action?:string;server_id?:string;game_id?:string;region?:string;max_players?:number;current_players?:number;version?:string;endpoint?:string;is_private?:boolean;join_code?:string}={};
  try{body=await req.json()}catch{return json({error:"Invalid JSON."},400)}

  if(body.action==="register"){
    if(!body.game_id)return json({error:"game_id is required."},400);
    const {data:game}=await admin.from("vertex_games").select("id,status,current_version").eq("id",body.game_id).maybeSingle();
    if(!game || game.status!=="published")return json({error:"Game is not published."},400);
    const maxPlayers=Math.max(1,Math.min(100,Number(body.max_players??16)));
    const {data,error}=await admin.from("vertex_game_servers").insert({
      game_id:body.game_id,region:(body.region??"ca-central-1").slice(0,32),max_players:maxPlayers,
      current_players:0,status:"online",version:(body.version??game.current_version??"0.1.0").slice(0,30),
      endpoint:body.endpoint??null,is_private:Boolean(body.is_private),join_code:body.join_code??null,
      last_heartbeat_at:new Date().toISOString()
    }).select("id,game_id,region,status,max_players,version").single();
    if(error)return json({error:error.message},500);
    return json({ok:true,server:data});
  }

  if(!body.server_id)return json({error:"server_id is required."},400);
  if(body.action==="heartbeat"){
    const update:{
      status:"online";current_players?:number;max_players?:number;endpoint?:string|null;version?:string;last_heartbeat_at:string;
    }={status:"online",last_heartbeat_at:new Date().toISOString()};
    if(body.current_players!==undefined)update.current_players=Math.max(0,Math.min(100,Number(body.current_players)));
    if(body.max_players!==undefined)update.max_players=Math.max(1,Math.min(100,Number(body.max_players)));
    if(body.endpoint!==undefined)update.endpoint=body.endpoint??null;
    if(body.version!==undefined)update.version=body.version.slice(0,30);
    const {error}=await admin.from("vertex_game_servers").update(update).eq("id",body.server_id);
    if(error)return json({error:error.message},500);
    return json({ok:true});
  }

  if(body.action==="offline"){
    const {error}=await admin.from("vertex_game_servers").update({status:"offline",current_players:0,last_heartbeat_at:new Date().toISOString()}).eq("id",body.server_id);
    if(error)return json({error:error.message},500);
    return json({ok:true});
  }

  return json({error:"Unknown action."},400);
});
