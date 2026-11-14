document.getElementById("contactForm").addEventListener("submit",async(event)=>{
 event.preventDefault();
 const form=document.getElementById("contactForm"),button=document.getElementById("sendMessage");
 const payload={name:document.getElementById("name").value.trim(),email:document.getElementById("email").value.trim(),subject:document.getElementById("subject").value.trim(),message:document.getElementById("message").value.trim()};
 if(Object.values(payload).some(v=>!v)){alert("Please fill all fields.");return;}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)){alert("Please enter a valid email address.");return;}
 button.disabled=true;button.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
 try{
  const response=await fetch("https://asia-south1-fire-united.cloudfunctions.net/submitContactMessage",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.success)throw new Error(result.message||"Submission failed.");
  alert(result.duplicate?"This message was already received.":"✅ Message Sent Successfully!");form.reset();
 }catch(error){console.error("Contact submission failed:",error);alert(error.message||"❌ Failed to send message. Please try again.");}
 finally{button.disabled=false;button.innerHTML="Send Message";}
});
