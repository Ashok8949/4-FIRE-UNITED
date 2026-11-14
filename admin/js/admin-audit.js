(function(){
'use strict';
const ADMIN='aks303603@gmail.com',SKIP=new Set(['adminAuditLogs','adminStudioVersions']);
function currentAdmin(){const u=window.auth&&auth.currentUser;return u&&u.email===ADMIN?u:null}
function safeClone(v){if(v==null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(safeClone);const out={};Object.keys(v).forEach(k=>{if(k==='__proto__'||k==='constructor')return;const x=v[k];if(x&&typeof x.toDate==='function')out[k]=x;else if(x&&typeof x==='object'&&typeof x.path==='string'&&typeof x.get==='function')out[k]='[DocumentReference: '+x.path+']';else out[k]=safeClone(x)});return out}
function refInfo(ref){const path=ref&&ref.path||'';const parts=path.split('/');return{path,collection:parts.length>=2?parts[parts.length-2]:'',id:parts[parts.length-1]||''}}
function labelFor(c){return({players:'Player',tournaments:'Tournament',gallery:'Gallery',clips:'Clip',announcements:'Announcement',settings:'Website settings',contactMessages:'Contact message',joinApplications:'Application',challengeRegistrations:'Challenge registration',notifications:'Notification',adminStudio:'Experience Studio draft'})[c]||c}
function titleFor(c,d,id){return d&&(d.name||d.title||d.username||d.ign||d.subject||d.brandName)||labelFor(c)+' · '+id}
async function writeLog(ref,operation,before,after,extra){
 const u=currentAdmin();if(!u)return;const info=refInfo(ref);if(!info.path||SKIP.has(info.collection)||info.collection==='adminAuditLogs')return;
 try{await window.db.collection('adminAuditLogs').add({schemaVersion:1,collection:info.collection,documentId:info.id,documentPath:info.path,operation,label:labelFor(info.collection),title:titleFor(info.collection,after||before,info.id),before:before===undefined?null:safeClone(before),after:after===undefined?null:safeClone(after),actor:u.email,actorUid:u.uid,page:(location.pathname.split('/').pop()||'admin'),createdAt:firebase.firestore.FieldValue.serverTimestamp(),clientAt:new Date().toISOString(),...(extra||{})})}
 catch(e){console.warn('[4FU audit] Action succeeded but audit record failed:',e)}
}
function patch(proto,name,kind){
 if(!proto||typeof proto[name]!=='function'||proto[name].__4fuAudit)return;
 const original=proto[name];
 const wrapped=function(){
  const ref=this,args=arguments,info=refInfo(ref);
  if(!currentAdmin()||SKIP.has(info.collection)||info.collection==='adminAuditLogs')return original.apply(ref,args);
  const run=async()=>{
   let before=null,exists=false;
   try{const snap=await ref.get();exists=snap.exists;before=exists?snap.data():null}catch(e){}
   const result=await original.apply(ref,args);
   let after=null,afterExists=false;
   try{const snap=await ref.get();afterExists=snap.exists;after=afterExists?snap.data():null}catch(e){}
   const op=kind==='add'?'create':kind==='delete'?'delete':(!exists?'create':kind);
   await writeLog(ref,op,exists?before:null,afterExists?after:null);
   return result;
  };
  return run();
 };
 wrapped.__4fuAudit=true;wrapped.__4fuOriginal=original;proto[name]=wrapped;
}
function install(){
 if(!window.firebase||!firebase.firestore||!window.db||window.__4fuAuditInstalled)return false;
 window.__4fuAuditInstalled=true;
 const ns=firebase.firestore;
 patch(ns.DocumentReference&&ns.DocumentReference.prototype,'set','set');
 patch(ns.DocumentReference&&ns.DocumentReference.prototype,'update','update');
 patch(ns.DocumentReference&&ns.DocumentReference.prototype,'delete','delete');
 patch(ns.CollectionReference&&ns.CollectionReference.prototype,'add','add');
 return true;
}
let tries=0;const timer=setInterval(()=>{if(install()||++tries>30)clearInterval(timer)},250);
window.FUAdminAudit={install,writeLog};
})();