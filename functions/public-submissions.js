"use strict";
const crypto=require("node:crypto");
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,UID=/^\d{5,15}$/,IDEM=/^[A-Za-z0-9_-]{16,80}$/;
const plain=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const bounded=(v,a,b)=>typeof v==="string"&&v.trim().length>=a&&v.trim().length<=b;
function validateContact(b){
 const keys=["name","email","subject","message"];
 if(!plain(b)||Object.keys(b).some(k=>!keys.includes(k))||!keys.every(k=>typeof b[k]==="string"))return null;
 const v={name:b.name.trim(),email:b.email.trim().toLowerCase(),subject:b.subject.trim(),message:b.message.trim()};
 return bounded(v.name,2,100)&&EMAIL.test(v.email)&&v.email.length<=254&&bounded(v.subject,2,150)&&bounded(v.message,5,4000)?v:null;
}
function validateChallenge(b){
 const keys=["challengeType","leaderName","leaderUID","whatsapp","email","teamName","preferredDate","preferredTime","message"];
 if(!plain(b)||Object.keys(b).some(k=>!keys.includes(k))||!["leaderName","leaderUID","whatsapp","email","teamName","preferredDate","preferredTime","message"].every(k=>typeof b[k]==="string"))return null;
 const v={challengeType:b.challengeType,leaderName:b.leaderName.trim(),leaderUID:b.leaderUID.trim(),whatsapp:b.whatsapp.trim(),email:b.email.trim().toLowerCase(),teamName:b.teamName.trim(),preferredDate:b.preferredDate,preferredTime:b.preferredTime,message:b.message.trim()};
 const dt=/^\d{4}-\d{2}-\d{2}$/.test(v.preferredDate)?new Date(v.preferredDate+"T00:00:00Z"):null;
 const validDate=v.preferredDate===""||(dt&&!Number.isNaN(dt.getTime())&&dt.toISOString().slice(0,10)===v.preferredDate);
 return ["1V1","2V2","4V4"].includes(v.challengeType)&&bounded(v.leaderName,2,80)&&UID.test(v.leaderUID)&&/^[+0-9()\s-]{7,20}$/.test(v.whatsapp)&&EMAIL.test(v.email)&&v.email.length<=254&&(v.challengeType==="1V1"||bounded(v.teamName,2,80))&&(v.challengeType!=="1V1"||v.teamName.length<=80)&&validDate&&(v.preferredTime===""||/^([01]\d|2[0-3]):[0-5]\d$/.test(v.preferredTime))&&v.message.length<=1000?v:null;
}
function validateJoin(b){
 const keys=["name","ign","uid","email","level","rank","about"];
 if(!plain(b)||Object.keys(b).some(k=>!keys.includes(k))||!keys.every(k=>typeof b[k]==="string"))return null;
 const v={name:b.name.trim(),ign:b.ign.trim(),uid:b.uid.trim(),email:b.email.trim().toLowerCase(),level:b.level.trim(),rank:b.rank.trim(),about:b.about.trim()};
 return bounded(v.name,2,100)&&bounded(v.ign,1,50)&&UID.test(v.uid)&&EMAIL.test(v.email)&&v.email.length<=254&&/^[0-9]{1,3}$/.test(v.level)&&["Bronze","Silver","Gold","Platinum","Diamond","Heroic","Grandmaster"].includes(v.rank)&&v.about.length<=2000?v:null;
}
function createPublicSubmissionHandlers({db,FieldValue,Timestamp,rateLimiter,hashKey,now=Date.now,randomBytes=crypto.randomBytes}){
 if(!db||!FieldValue||!Timestamp||!rateLimiter||typeof hashKey!=="function")throw new TypeError("Public submission dependencies are required.");
 const date=()=>new Date(now()).toLocaleDateString("en-GB",{timeZone:"Asia/Kolkata"});
 const reply=(res,n,v)=>res.status(n).json(v);
 async function submit(req,res,o){
  if(req.method!=="POST")return reply(res,405,{success:false,message:"Method not allowed."});
  if(!plain(req.body))return reply(res,400,{success:false,message:"Invalid submission."});
  let size;try{size=Buffer.byteLength(JSON.stringify(req.body),"utf8");}catch(_){return reply(res,400,{success:false,message:"Invalid submission."});}
  if(size>8192)return reply(res,413,{success:false,message:"Submission is too large."});
  const clean=o.validate(req.body);if(!clean)return reply(res,400,{success:false,message:"Please check the submitted fields."});
  const key=req.headers?.["idempotency-key"];
  if(typeof key!=="string"||!IDEM.test(key))return reply(res,400,{success:false,message:"A valid submission token is required. Please refresh and try again."});
  try{
   if(!await rateLimiter.allow(req,o.scope,3,600000))return reply(res,429,{success:false,message:"Too many submissions. Please try again in 10 minutes."});
   if(typeof req.ip!=="string"||!req.ip)return reply(res,400,{success:false,message:"Unable to validate this request."});
   const keyRef=db.collection("publicSubmissionKeys").doc(hashKey(o.scope+":"+req.ip+":"+key));
   const recordRef=db.collection(o.collection).doc(),record=o.build(clean,date(),FieldValue,randomBytes);
   const result=await db.runTransaction(async tx=>{
    const prior=await tx.get(keyRef);if(prior.exists)return {duplicate:true,data:prior.data()};
    tx.create(recordRef,record);
    const data={recordId:recordRef.id,...o.response(record),createdAt:FieldValue.serverTimestamp(),expiresAt:Timestamp.fromMillis(now()+172800000)};
    tx.create(keyRef,data);return {duplicate:false,data};
   });
   return reply(res,result.duplicate?200:201,{success:true,duplicate:result.duplicate,...o.response(result.data)});
  }catch(error){console.error("Public submission failed:",o.scope,error?.message||"unknown");return reply(res,503,{success:false,message:"Submission service is temporarily unavailable. Please try again later."});}
 }
 return {
  contact:(req,res)=>submit(req,res,{scope:"contact-submit",collection:"contactMessages",validate:validateContact,build:(v,d,F)=>({...v,status:"New",createdAt:F.serverTimestamp(),date:d}),response:()=>({})}),
  challenge:(req,res)=>submit(req,res,{scope:"challenge-submit",collection:"challengeRegistrations",validate:validateChallenge,build:(v,d,F,bytes)=>{const id="#4FU-"+bytes(4).toString("hex").toUpperCase();return {...v,registrationId:id,selectedChallenge:v.challengeType,status:"New",createdAt:F.serverTimestamp(),date:d};},response:v=>({registrationId:v.registrationId||""})}),
  join:(req,res)=>submit(req,res,{scope:"join-submit",collection:"joinApplications",validate:validateJoin,build:(v,d)=>({...v,status:"Pending",appliedOn:d}),response:()=>({status:"Pending"})})
 };
}
module.exports={createPublicSubmissionHandlers,validateContact,validateChallenge,validateJoin};
