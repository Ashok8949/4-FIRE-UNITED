/* Private, admin-only original experience rollback control. */
(()=>{"use strict";
const ADMIN="aks303603@gmail.com";
function mount(){
 const actions=document.querySelector(".release .actions");if(!actions||document.getElementById("studioOriginalRestore"))return;
 const button=document.createElement("button");button.type="button";button.id="studioOriginalRestore";button.textContent="Restore Original Website";button.disabled=true;
 const status=document.createElement("span");status.id="studioBaselineState";status.setAttribute("role","status");status.textContent="Checking private rollback snapshot…";
 actions.append(button);actions.parentElement.append(status);
 const baselineRef=db.collection("adminStudio").doc("websiteExperienceBaseline");
 const siteRef=db.collection("settings").doc("website");
 const versions=db.collection("adminStudioVersions");
 async function check(){try{const snap=await baselineRef.get();if(snap.exists){button.disabled=false;status.textContent="Original baseline protected · one-click restore available."}else{button.disabled=true;status.textContent="Baseline not captured yet. The first successful Studio publish will create it automatically."}}catch(e){button.disabled=true;status.textContent="Rollback status unavailable. Check private admin storage permissions.";console.warn("[4FU Studio rollback]",e)}}
 window.addEventListener("4fu:studio-baseline-ready",check);
 button.addEventListener("click",async()=>{
  if(button.disabled)return;
  if(!auth.currentUser||String(auth.currentUser.email||"").toLowerCase()!==ADMIN){status.textContent="Only the authorised Studio administrator can restore the website.";return}
  const ok=confirm("Restore the original website experience captured before the first Studio publish? This changes the live website configuration immediately. Your current private draft will remain untouched, and the current live version will be saved to history first.");
  if(!ok)return;
  button.disabled=true;status.textContent="Restoring original website…";
  try{
   const historyRef=versions.doc();
   await db.runTransaction(async tx=>{
    const [baselineSnap,siteSnap]=await Promise.all([tx.get(baselineRef),tx.get(siteRef)]);
    if(!baselineSnap.exists)throw new Error("No original baseline exists yet.");
    const baseline=baselineSnap.data(),current=siteSnap.exists?siteSnap.data():{},currentExp=current.experience||{};
    tx.set(historyRef,{schemaVersion:3,design:currentExp.design||{},brand:currentExp.brand||{},festivalLibrary:currentExp.festivalLibrary||[],animation:currentExp.animation||{},loader:currentExp.loader||{},assets:currentExp.assets||[],content:currentExp.content||{},status:"pre-rollback",createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:auth.currentUser.email});
    if(baseline.exists&&baseline.experience&&typeof baseline.experience==="object")tx.set(siteRef,{...current,experience:baseline.experience});
    else if(siteSnap.exists)tx.update(siteRef,{experience:firebase.firestore.FieldValue.delete()});
   });
   status.textContent="Original website experience restored. The previous live version is saved in Studio history.";
   button.disabled=false;
   window.dispatchEvent(new CustomEvent("4fu:studio-original-restored"));
  }catch(e){console.error(e);status.textContent=e.message||"Restore failed. The live website was not intentionally changed.";button.disabled=false}
 });
 check();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();