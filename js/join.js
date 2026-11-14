document.getElementById("joinForm").addEventListener("submit",async(event)=>{
 event.preventDefault();
 const form=document.getElementById("joinForm"),button=document.getElementById("applyBtn");
 const payload={name:document.getElementById("name").value.trim(),ign:document.getElementById("ign").value.trim(),uid:document.getElementById("uid").value.trim(),email:document.getElementById("email").value.trim(),level:document.getElementById("level").value,rank:document.getElementById("rank").value,about:document.getElementById("about").value.trim()};
 if(!payload.name||!payload.ign||!payload.uid||!payload.email||!payload.level){alert("Please fill all required fields.");return;}
 button.disabled=true;button.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Applying...';
 try{
  const response=await fetch("https://asia-south1-fire-united.cloudfunctions.net/submitJoinApplication",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.success)throw new Error(result.message||"Application submission failed.");
  alert(result.duplicate?"This application was already received.":"✅ Application Submitted Successfully!");form.reset();
 }catch(error){console.error("Join application submission failed:",error);alert(error.message||"❌ Failed to submit application.");}
 finally{button.disabled=false;button.innerHTML="Apply Now";}
});
