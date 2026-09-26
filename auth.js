(()=>{"use strict";
const SB_URL="https://zqvntzvugfbvdwkoxfbm.supabase.co";
const SB_KEY="sb_publishable_hXc8J0cDIXTKJn5eQVJQrw_jsyYJjYy";
const db=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=s=>document.querySelector(s);
const mode=document.body.dataset.mode||"signin";
const redirectHome=()=>{location.href="./index.html#home"};
const setStatus=(m,type="")=>{const e=$("#status");if(e){e.textContent=m;e.className="status "+type}};
const is12=d=>{const b=new Date(d+"T00:00:00"),n=new Date();let a=n.getFullYear()-b.getFullYear();const mo=n.getMonth()-b.getMonth();if(mo<0||(mo===0&&n.getDate()<b.getDate()))a--;return a>=12};
const humanError=e=>{
 const m=String(e?.message||e||"");
 if(/already registered|already exists/i.test(m))return "That email already has a Vertex account. Try signing in instead.";
 if(/invalid login credentials/i.test(m))return "The email or password is incorrect.";
 if(/email.*not.*confirmed/i.test(m))return "Please confirm your email before signing in.";
 return m||"Something went wrong. Please try again.";
};
async function boot(){
 const s=await db.auth.getSession();
 if(s.data.session){redirectHome();return}
 $("#google")?.addEventListener("click",async()=>{
   setStatus("Opening Google…");
   const {error}=await db.auth.signInWithOAuth({provider:"google"});
   if(error)setStatus(humanError(error),"bad");
 });
 $("#switch")?.addEventListener("click",()=>{location.href=mode==="signup"?"./signin.html":"./signup.html"});
 $("#form")?.addEventListener("submit",async e=>{
   e.preventDefault();
   const email=$("#email").value.trim().toLowerCase(),password=$("#password").value;
   if(!email||!password)return setStatus("Enter your email and password.","bad");
   if(mode==="signup"){
     const username=$("#username").value.trim().toLowerCase();
     const display=$("#display").value.trim();
     const dob=$("#dob").value;
     if(!/^[a-z0-9_]{3,24}$/.test(username))return setStatus("Username must be 3–24 lowercase letters, numbers, or underscores.","bad");
     if(!dob||!is12(dob))return setStatus("Vertex requires users to be at least 12.","bad");
     if(password.length<8)return setStatus("Use a password with at least 8 characters.","bad");
     if(!$("#agree").checked)return setStatus("Accept the Vertex Terms and Community Guidelines to continue.","bad");
     setStatus("Creating your Vertex account…");
     const {data,error}=await db.auth.signUp({
       email,password,
       options:{data:{
         username,
         full_name:display||username,
         birth_date:dob
       }}
     });
     if(error)return setStatus(humanError(error),"bad");
     if(data.session){setStatus("Account created. Opening Vertex…","good");return setTimeout(redirectHome,250)}
     setStatus("Account created. Check your email to confirm the account, then sign in.","good");
   }else{
     setStatus("Signing you in…");
     const {data,error}=await db.auth.signInWithPassword({email,password});
     if(error)return setStatus(humanError(error),"bad");
     if(data.session){setStatus("Signed in. Opening Vertex…","good");setTimeout(redirectHome,200)}
   }
 });
 $("#forgot")?.addEventListener("click",async()=>{
   const email=$("#email").value.trim().toLowerCase();
   if(!email)return setStatus("Enter your email first.","bad");
   setStatus("Sending password reset…");
   const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:new URL("./index.html#reset-password",location.href).href});
   if(error)return setStatus(humanError(error),"bad");
   setStatus("If that account exists, a password reset email was sent.","good");
 });
 setTimeout(async()=>{
   const x=await db.auth.getSession();
   if(x.data.session)redirectHome();
 },400);
}
addEventListener("load",boot);
})();