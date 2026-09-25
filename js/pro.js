(() => {
  "use strict";
  console.info("[4FU PRO V11] pro.js loaded — saved B2 mode only");
  const state = { user:null, player:null };
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[s]));
  const num = (v,f=0) => { const n=parseFloat(String(v??"").replace(/[^\d.-]/g,"")); return Number.isFinite(n)?n:f; };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const playerName=p=>p.name||p.playerName||p.ign||"PLAYER";
  const playerImage=p=>p.image||p.photo||p.profileImage||p.avatar||p.profilePhoto||"./images/logo/logo.png";
  const toast=msg=>{const e=$("toast");if(!e)return;e.textContent=msg;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2600)};
  const getDb=()=>{try{if(window.firebase&&typeof window.firebase.firestore==="function")return window.firebase.firestore();if(window.db&&typeof window.db.collection==="function")return window.db;return null}catch(_){return null}};
  const getAuth=()=>{try{if(window.firebase&&typeof window.firebase.auth==="function")return window.firebase.auth();if(window.auth&&typeof window.auth.onAuthStateChanged==="function")return window.auth;return null}catch(_){return null}};

  const PRO_WORKER_URL = "https://4fu-freefire-backend.4fu-freefire-backend.workers.dev";
  const PRO_PRICE = 49;

  async function firebaseIdToken(forceRefresh=false){
    const A=getAuth();
    if(!A?.currentUser) throw new Error("Firebase login required.");
    return await A.currentUser.getIdToken(forceRefresh);
  }

  async function proApi(path, options={}){
    const token=await firebaseIdToken();
    const headers={"Accept":"application/json","Authorization":`Bearer ${token}`,...(options.headers||{})};
    if(options.body && typeof options.body!=="string"){
      headers["Content-Type"]="application/json";
      options.body=JSON.stringify(options.body);
    }
    let response=await fetch(`${PRO_WORKER_URL}${path}`,{...options,headers,cache:"no-store"});
    let data=null;
    try{data=await response.json()}catch(_){}
    if(response.status===401){
      const fresh=await firebaseIdToken(true);
      headers.Authorization=`Bearer ${fresh}`;
      response=await fetch(`${PRO_WORKER_URL}${path}`,{...options,headers,cache:"no-store"});
      try{data=await response.json()}catch(_){}
    }
    if(!response.ok || data?.success===false) throw new Error(data?.error||`PRO API HTTP ${response.status}`);
    return data;
  }

  function setProLocked(locked, message=""){
    document.body.classList.toggle("pro-locked",locked);
    const paywall=$("proPaywall");
    const getBtn=$("getProBtn");
    const shareBtn=$("sharePro");
    if(paywall) paywall.hidden=!locked;
    if(getBtn) getBtn.style.display=locked?"inline-flex":"none";
    if(shareBtn) shareBtn.style.display=locked?"none":"inline-flex";
    if(message && $("proPayStatus")) $("proPayStatus").textContent=message;
  }

  function subscriptionFromResponse(data){
    return data?.subscription || data?.data?.subscription || data?.razorpaySubscription || data?.data || data;
  }

  async function startProPayment(){
    if(!state.user) return toast("Pehle Firebase login karo.");
    const payBtn=$("payProBtn"), status=$("proPayStatus");
    try{
      if(payBtn){payBtn.disabled=true;payBtn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Creating secure checkout...';}
      if(status) status.textContent="Creating your Razorpay subscription…";
      const created=await proApi("/pro/create-subscription",{method:"POST",body:{}});
      if(created?.alreadyActive || created?.proActive){
        setProLocked(false);
        toast("4FU PRO is already active.");
        if(payBtn){payBtn.disabled=false;payBtn.innerHTML='<i class="fa-solid fa-lock-open"></i> Start PRO — ₹49/month';}
        return;
      }
      const subscriptionId=created?.subscriptionId||created?.subscription_id||created?.subscription?.id||created?.data?.subscriptionId;
      const keyId=created?.razorpayKeyId||created?.keyId||created?.data?.razorpayKeyId||created?.data?.keyId;
      if(!subscriptionId) throw new Error("Razorpay subscription ID missing.");
      if(!keyId) throw new Error("Razorpay Key ID missing from Worker response.");

      const A=getAuth();
      const user=A?.currentUser;
      const options={
        key:keyId,
        subscription_id:subscriptionId,
        name:"4FU • Fire United",
        description:"4FU PRO — ₹49/month",
        image:"./images/logo/logo.png",
        prefill:{
          name:created?.prefill?.name||user?.displayName||playerName(state.player),
          email:created?.prefill?.email||user?.email||state.player?.loginEmail||""
        },
        notes:{playerId:state.player?.id||"",uid:user?.uid||""},
        theme:{color:"#f5b942"},
        handler:async function(payment){
          try{
            if(status) status.textContent="Payment received. Verifying securely…";
            const verify=await proApi("/pro/verify",{
              method:"POST",
              body:{
                razorpay_payment_id:payment.razorpay_payment_id,
                razorpay_subscription_id:payment.razorpay_subscription_id||subscriptionId,
                razorpay_signature:payment.razorpay_signature
              }
            });
            if(verify?.active===false) throw new Error("Payment verified, but PRO is not active yet. Webhook may still be processing.");
            toast("🎉 4FU PRO activated!");
            setProLocked(false);
            const D=getDb();
            if(D && state.player?.id){
              const fresh=await D.collection("players").doc(state.player.id).get();
              if(fresh.exists) state.player={id:fresh.id,...fresh.data()};
            }
            render(state.player);
            if(status) status.textContent="4FU PRO is active.";
          }catch(err){
            console.error("[4FU PRO] verification failed",err);
            if(status) status.textContent=err.message||"Verification failed.";
            toast(err.message||"Payment verification failed.");
          }finally{
            if(payBtn){payBtn.disabled=false;payBtn.innerHTML='<i class="fa-solid fa-lock-open"></i> Start PRO — ₹49/month';}
          }
        },
        modal:{
          ondismiss:function(){
            if(status) status.textContent="Payment window closed. You can try again.";
            if(payBtn){payBtn.disabled=false;payBtn.innerHTML='<i class="fa-solid fa-lock-open"></i> Start PRO — ₹49/month';}
          }
        }
      };
      const rzp=new Razorpay(options);
      rzp.on("payment.failed",function(resp){
        console.error("[4FU PRO] Razorpay payment failed",resp?.error);
        if(status) status.textContent=resp?.error?.description||"Payment failed. Please try again.";
        if(payBtn){payBtn.disabled=false;payBtn.innerHTML='<i class="fa-solid fa-lock-open"></i> Start PRO — ₹49/month';}
        toast("Payment failed. Please try again.");
      });
      rzp.open();
    }catch(err){
      console.error("[4FU PRO] checkout creation failed",err);
      if(status) status.textContent=err.message||"Unable to start payment.";
      if(payBtn){payBtn.disabled=false;payBtn.innerHTML='<i class="fa-solid fa-lock-open"></i> Start PRO — ₹49/month';}
      toast(err.message||"Unable to start PRO payment.");
    }
  }

  async function checkProEntitlement(){
    const data=await proApi("/pro/status",{method:"GET"});
    const active=Boolean(data?.active ?? data?.proActive ?? data?.entitlement?.active);
    if(!active){
      setProLocked(true,"₹49/month • Secure Razorpay subscription");
      return false;
    }
    setProLocked(false);
    return true;
  }
  function profileUrl(id){const u=new URL(location.href);u.search="";u.hash="";u.searchParams.set("id",id);return u.toString()}
  function stats(p){
    /*
     * PRO stats source order:
     * 1) Existing Firestore player document
     * 2) Saved Free Fire snapshot returned by the existing 4FU Worker/B2
     *
     * IMPORTANT: this function never calls a live Free Fire provider.
     */
    const sources=[
      p?.stats,
      p?.freeFireStats,
      p?.ffStats,
      p?.playerStats,
      p?.statistics,
      p?.liveStats,
      p?.freeFireData?.stats,
      p?.freeFireData?.statistics,
      p?.freeFireData?.detailed,
      p?.freeFireProfile?.stats,
      p?.savedFreeFireData?.stats,
      p?.savedFreeFireData?.detailed,
      p?.savedProfile?.stats,
      p?.profile?.stats,
      p?.data?.stats,
      p?.detailed,
      p
    ].filter(Boolean);

    const pick=(...x)=>x.find(v=>v!==undefined&&v!==null&&v!=="");
    const from=(...keys)=>{
      for(const src of sources){
        const v=pick(...keys.map(k=>src?.[k]));
        if(v!==undefined)return v;
      }
      return undefined;
    };

    let m=from("matches","gamesPlayed","gamesplayed","totalMatches","matchCount");
    let w=from("wins","booyah","totalWins","booyahs","booyahCount");
    let k=from("kills","totalKills","killCount");
    let d=from("deaths","totalDeaths","deathCount");
    let kd=from("kd","kdRatio","kdr");
    let hs=from("headshot","headshotRate","headshotPercentage","hsRate");
    let br=from("booyahRate","winRate");

    // The Worker also preserves raw mode stats in rawStats. If a saved
    // snapshot does not expose the aggregate stats at top level, calculate
    // the same aggregate from solo/duo/squad that the Worker uses.
    const rawList=[
      p?.rawStats,
      p?.freeFireData?.rawStats,
      p?.savedFreeFireData?.rawStats,
      p?.savedProfile?.rawStats
    ].filter(Boolean);

    if(rawList.length){
      const rows=[];
      for(const raw of rawList){
        const src=raw?.stats||raw;
        const solo=src?.solostats||src?.solo||src?.soloStats||src?.soloCareer||src?.soloMode;
        const duo=src?.duostats||src?.duo||src?.duoStats||src?.duoCareer||src?.duoMode;
        const squad=src?.quadstats||src?.squad||src?.squadStats||src?.squadCareer||src?.quadMode||src?.squadMode;
        [solo,duo,squad].filter(Boolean).forEach(x=>rows.push(x));
      }

      if(rows.length){
        const sum=(...keys)=>rows.reduce((total,row)=>{
          for(const key of keys){
            const value=row?.[key] ?? row?.detailedstats?.[key] ?? row?.detailedStats?.[key];
            const n=Number(value);
            if(Number.isFinite(n)) return total+n;
          }
          return total;
        },0);

        const calcM=sum("gamesplayed","gamesPlayed","matches");
        const calcW=sum("wins","booyah");
        const calcK=sum("kills");
        const calcD=sum("deaths") || Math.max(0,calcM-calcW);
        const calcHSK=sum("headshotkills","headshotKills");

        if(m==null && calcM) m=calcM;
        if(w==null && calcW) w=calcW;
        if(k==null && calcK) k=calcK;
        if(d==null && calcD) d=calcD;
        if(kd==null && calcD>0) kd=(calcK/calcD).toFixed(2);
        if(hs==null && calcK>0) hs=((calcHSK/calcK)*100).toFixed(2);
        if(br==null && calcM>0) br=((calcW/calcM)*100).toFixed(2);
      }
    }

    if(kd==null && Number(d)>0) kd=(Number(k)/Number(d)).toFixed(2);
    if(hs==null && Number(k)>0 && Number.isFinite(Number(from("headshotKills","headshots")))) {
      const hsk=Number(from("headshotKills","headshots"));
      hs=((hsk/Number(k))*100).toFixed(2);
    }
    if(br==null && Number(m)>0 && Number.isFinite(Number(w))) br=((Number(w)/Number(m))*100).toFixed(2);

    return{matches:m,wins:w,kills:k,deaths:d,kd,headshot:hs,booyahRate:br};
  }

  /* =========================================================
     SAVED FREE FIRE DATA (B2 VIA EXISTING 4FU WORKER)
     ---------------------------------------------------------
     IMPORTANT: this request NEVER sends refresh=1/update=1/force=1.
     The existing Worker therefore returns the last saved Backblaze B2
     snapshot and does not call the live Free Fire providers.
  ========================================================= */
  const SAVED_FF_WORKER_URL =
    "https://4fu-freefire-backend.4fu-freefire.workers.dev";

  async function loadSavedFreeFireData(uid, region) {
    if (!uid) return null;

    const url = new URL(SAVED_FF_WORKER_URL);
    url.searchParams.set("uid", String(uid));
    url.searchParams.set("region", String(region || "IND").toUpperCase());
    // Deliberately NO refresh/update/force parameter.

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Saved Free Fire Worker HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data || typeof data !== "object" || data.success === false) {
        throw new Error(data?.error || "Saved Free Fire data unavailable");
      }

      console.info("[4FU PRO] Saved B2 Free Fire data loaded. Live API was not requested.", {
        dataSource: data.dataSource || null,
        liveApiCalled: data.liveApiCalled,
        lastUpdated: data.lastUpdated || null
      });

      return data;
    } catch (error) {
      console.warn("[4FU PRO] Saved B2 Free Fire data unavailable:", error);
      return null;
    }
  }

  function applySavedFreeFireData(p, data) {
    if (!data) return p;

    const ffStats = data.stats || data.statistics || {};

    // Keep the existing Firestore identity/profile fields untouched.
    // Only add the saved snapshot as a local runtime source. Nothing is
    // written back to Firestore and no live provider is requested here.
    const merged = { ...p };
    merged.freeFireData = data;
    merged.savedFreeFireData = data;
    merged.rawStats = data.rawStats || merged.rawStats;
    merged.detailed = data.detailed || merged.detailed;

    if (merged.uid == null || merged.uid === "") merged.uid = data.uid || data.basicInfo?.accountId;
    if (merged.level == null || merged.level === "") merged.level = data.level || data.basicInfo?.level;
    if (merged.rank == null || merged.rank === "") merged.rank = data.rank || data.rankName || data.basicInfo?.rank;

    merged.stats = {
      ...(p.stats || {}),
      ...ffStats
    };

    if (merged.kd == null || merged.kd === "") merged.kd = ffStats.kd;
    if (merged.headshot == null || merged.headshot === "") {
      merged.headshot = ffStats.headshot ?? ffStats.headshotRate ?? data.headshot ?? data.headshotRate;
    }
    if (merged.booyah == null || merged.booyah === "") merged.booyah = ffStats.wins;
    if (merged.matches == null || merged.matches === "") merged.matches = ffStats.matches;

    console.info("[4FU PRO V11] Saved B2 snapshot mapped", {
      dataSource: data.dataSource || null,
      liveApiCalled: data.liveApiCalled,
      matches: merged.matches,
      wins: merged.booyah,
      kd: merged.kd,
      headshot: merged.headshot
    });

    return merged;
  }

  const STUDIO_DEFAULTS={theme:"obsidian",motion:"cinematic",effects:{mainSnake:true,mainGlow:true,mainShine:true,mainTilt:true,bannerAnimation:true,bannerGlow:true,bannerShine:true,bannerSnake:false,avatarRing:true,avatarGlow:true,avatarPulse:false,proCrown:true,weaponGlow:true,weaponFloat:true,weaponShine:true,weaponSnake:false,weaponParallax:true,statsGlow:true,statsFire:false,statsShine:true,statsHover:true,achievementGlow:true,achievementShine:true,achievementHover:true,gameGlow:true,gameFloat:true,gameBorder:false,showcaseFrame:true,showcaseGlow:true,showcaseZoom:true,showcaseShine:true,particles:true,ambientGlow:true,scrollReveal:true,cursorGlow:false,frameGold:true,frameAnimated:true,frameShine:true,frameCorners:false,xpAnimated:true,statNumberGlow:true,levelPulse:true,sectionLines:true}};
  const cloneStudio=o=>JSON.parse(JSON.stringify(o));
  function theme(t){t=t||"obsidian";document.body.dataset.theme=t;localStorage.setItem("4fuProTheme",t);document.querySelectorAll(".theme").forEach(b=>b.classList.toggle("active",b.dataset.theme===t));document.querySelectorAll(".studio-preset").forEach(b=>b.classList.toggle("active",b.dataset.preset===t));}
  function studioStateFromPlayer(p){const saved=p?.proCustomization||{};return {theme:saved.theme||p?.proTheme||localStorage.getItem("4fuProTheme")||"obsidian",motion:saved.motion||localStorage.getItem("4fuProMotion")||"cinematic",effects:{...cloneStudio(STUDIO_DEFAULTS.effects),...(saved.effects||{})}}}
  function setStudioControls(s){document.querySelectorAll("[data-effect]").forEach(el=>{el.checked=s.effects[el.dataset.effect]!==false});theme(s.theme);const mv=s.motion||"cinematic";document.body.dataset.motion=mv;localStorage.setItem("4fuProMotion",mv);document.querySelectorAll(".motion-pill").forEach(b=>b.classList.toggle("active",b.dataset.motion===mv))}
  function getStudioState(){const effects={};document.querySelectorAll("[data-effect]").forEach(el=>effects[el.dataset.effect]=!!el.checked);return {theme:document.body.dataset.theme||"obsidian",motion:document.body.dataset.motion||localStorage.getItem("4fuProMotion")||"cinematic",effects}}
  function studioPreset(name){
    const p={
      inferno:{theme:"inferno",motion:"aggressive",effects:{...cloneStudio(STUDIO_DEFAULTS.effects),statsFire:true,bannerSnake:true,weaponSnake:true,gameBorder:true}},
      cyber:{theme:"cyber",motion:"aggressive",effects:{...cloneStudio(STUDIO_DEFAULTS.effects),statsFire:false,bannerSnake:true,weaponSnake:true,gameBorder:true,cursorGlow:true}},
      royal:{theme:"royal",motion:"cinematic",effects:{...cloneStudio(STUDIO_DEFAULTS.effects),mainSnake:true,bannerSnake:false,weaponSnake:true,statsFire:false}},
      aurora:{theme:"aurora",motion:"smooth",effects:{...cloneStudio(STUDIO_DEFAULTS.effects),statsFire:false,gameBorder:false}}
    }[name];
    if(!p)return;setStudioControls(p);toast(`${name.toUpperCase()} preset preview ready.`)
  }
  function studioStatus(text,ok=true){const e=$("studioStatus");if(!e)return;e.classList.toggle("error",!ok);e.querySelector("b").textContent=text;e.querySelector("small").textContent=ok?"Saved customization is synced to your public profile.":"Save failed — existing profile was not changed."}
  async function saveStudio(){
    if(!state.player?.id)return toast("Player profile not loaded.");
    const s=getStudioState();
    studioStatus("Saving…",true);
    try{
      const data=await proApi("/pro/customization",{method:"POST",body:{customization:s}});
      state.player.proCustomization=data.customization||s;state.player.proTheme=s.theme;
      localStorage.setItem("4fuProTheme",s.theme);localStorage.setItem("4fuProCustomization",JSON.stringify(s));
      studioStatus("Saved ✓",true);toast("PRO customization public profile par save ho gayi 👑");
    }catch(err){studioStatus("Save failed",false);toast(err?.message||"Customization save nahi hui.")}
  }
  function resetStudio(){const s=cloneStudio(STUDIO_DEFAULTS);setStudioControls(s);toast("Normal PRO effects preview restored. Save karo to public profile par apply hoga.")}
  function initStudio(){
    document.querySelectorAll(".motion-pill").forEach(b=>b.addEventListener("click",()=>{document.body.dataset.motion=b.dataset.motion;localStorage.setItem("4fuProMotion",b.dataset.motion);}));
    document.querySelectorAll(".studio-preset").forEach(b=>b.addEventListener("click",()=>b.dataset.preset==="custom"?toast("Custom mode — individual controls use karo."):studioPreset(b.dataset.preset)));
    document.querySelectorAll("[data-effect]").forEach(el=>el.addEventListener("change",()=>{document.querySelectorAll(".studio-preset").forEach(b=>b.classList.toggle("active",b.dataset.preset==="custom"));}));
    $("studioSave")?.addEventListener("click",saveStudio);$("studioReset")?.addEventListener("click",resetStudio);$("studioPreview")?.addEventListener("click",()=>toast("Preview controls are ready — Save to publish them."));
  }
  function qr(){const box=$("qrMini");if(!box||!window.QRCode||!state.player)return;box.innerHTML="";new QRCode(box,{text:profileUrl(state.player.id),width:66,height:66,colorDark:"#101116",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M})}
  function renderStats(p){
    const s=stats(p);
    const kdValue=s.kd!==undefined&&s.kd!==null&&s.kd!=="" ? num(s.kd) : null;
    const hsValue=s.headshot!==undefined&&s.headshot!==null&&s.headshot!=="" ? num(s.headshot) : null;
    const matchesValue=s.matches!==undefined&&s.matches!==null&&s.matches!=="" ? num(s.matches) : null;
    const winsValue=s.wins!==undefined&&s.wins!==null&&s.wins!=="" ? num(s.wins) : null;
    const rateValue=s.booyahRate!==undefined&&s.booyahRate!==null&&s.booyahRate!=="" ? num(s.booyahRate) : null;
    // Performance Lab cards
    $("kd").textContent=kdValue===null?"—":String(s.kd);
    $("headshot").textContent=hsValue===null?"—":`${hsValue}%`;
    $("booyah").textContent=winsValue!==null?String(s.wins):(rateValue!==null?`${rateValue}%`:"—");
    $("matches").textContent=matchesValue===null?"—":String(s.matches);

    // TOP quick-stat cards
    $("quickKd").textContent=kdValue===null?"—":String(s.kd);
    $("quickHs").textContent=hsValue===null?"—":`${hsValue}%`;
    $("quickWins").textContent=winsValue===null?"—":String(s.wins);
    $("quickMatches").textContent=matchesValue===null?"—":String(s.matches);
    $("kdBar").style.width=`${clamp((kdValue??0)/5*100,0,100)}%`;
    $("hsBar").style.width=`${clamp(hsValue??0,0,100)}%`;
    $("booyahBar").style.width=`${clamp(rateValue!==null?rateValue:(winsValue??0),0,100)}%`;
    $("matchesBar").style.width=`${clamp((matchesValue??0)/1000*100,0,100)}%`;
    const form=kdValue===null?null:clamp(Math.round(kdValue*14+(hsValue??0)*.35+(rateValue!==null?rateValue:(winsValue??0))*.5),0,100);
    const cons=kdValue===null?null:clamp(Math.round(100-Math.abs(kdValue-3)*14),0,100);
    $("formScore").textContent=form===null?"—":`${form}/100`;
    $("consistency").textContent=cons===null?"—":`${cons}%`;
  }
  function achievements(p){const base=[["fa-gem","PRO Identity","Premium member"],["fa-fire","Fire Born","4FU activity"],["fa-crosshairs","Sharpshooter","Combat profile"],["fa-bolt","Clutch Mode","Performance"],["fa-shield-halved","Elite Guard","Team identity"],["fa-star","Signature","PRO showcase"]];const list=Array.isArray(p.proAchievements)&&p.proAchievements.length?p.proAchievements.slice(0,6).map(a=>[a.icon||"fa-trophy",a.title||"Achievement",a.description||"Unlocked"]):base;$("achievements").textContent=list.length;$("achievementGrid").innerHTML=list.map(a=>`<div class="achievement"><div class="ico"><i class="fa-solid ${esc(a[0])}"></i></div><b>${esc(a[1])}</b><small>${esc(a[2])}</small></div>`).join("")}
  function missions(p){const list=Array.isArray(p.proMissions)&&p.proMissions.length?p.proMissions:[{t:"Complete your PRO identity",d:"Set your title and aura.",r:"+100 XP"},{t:"Share your PRO card",d:"Create your public PRO moment.",r:"+150 XP"},{t:"Reach 10 profile views",d:"Let the community discover you.",r:"+200 XP"},{t:"Complete 5 player battles",d:"Use Battle Center.",r:"+300 XP"},{t:"Unlock a mystery drop",d:"Open a rotating PRO reward.",r:"+250 XP"}];$("missionList").innerHTML=list.slice(0,6).map((m,i)=>{if(Array.isArray(m))m={t:m[0],d:m[1],r:m[2]};return`<div class="mission"><div class="mission-check">${i+1}</div><div class="mission-copy"><b>${esc(m.t)}</b><small>${esc(m.d)}</small></div><span class="reward">${esc(m.r)}</span></div>`}).join("")}
  function render(p){
    const name=playerName(p),xp=Math.max(0,num(p.proXP)),level=Math.max(1,Math.floor(num(p.proLevel,1))),cur=xp%1000,pct=cur/10;
    $("proAvatar").src=playerImage(p);$("cardAvatar").src=playerImage(p);$("proName").textContent=name;$("proRole").textContent=p.role||"PLAYER";$("proTitle").textContent=p.proTitle||"PRO";$("proLevelChip").textContent=`LEVEL ${level}`;$("xpValue").textContent=xp.toLocaleString();$("levelValue").textContent=level;$("xpBar").style.width=`${pct}%`;$("xpCurrent").textContent=`${cur.toLocaleString()} / 1,000 XP`;$("views").textContent=num(p.profileViews).toLocaleString();$("battles").textContent=num(p.proBattles).toLocaleString();$("streak").textContent=`${num(p.proStreak)} DAYS`;$("shareName").textContent=name;$("shareMeta").textContent=`4FU PRO • ${p.proTitle||"PRO"}`;renderStats(p);achievements(p);missions(p);renderExtra(p);qr();theme(localStorage.getItem("4fuProTheme")||p.proTheme||"obsidian");
    renderIdentity(p);
  }
  function renderIdentity(p){
    const ff=p?.freeFireData||p?.freeFireProfile||p?.savedFreeFireData||p?.savedProfile||p?.profile||{};
    const basic=ff?.basicInfo||ff?.basic_info||ff?.profile?.basicInfo||{};

    const uid=p.uid||p.freeFireUid||p.playerUid||p.accountId||p.freefireUid||
      ff.uid||ff.accountId||basic.accountId;
    $("proUid").textContent=uid?`UID ${uid}`:"UID —";

    const rank=p.rank||p.rankName||p.ffRank||basic.rank||ff.rank||ff.rankName;
    $("proRank").textContent=rank!==undefined&&rank!==null&&rank!==""?`RANK ${rank}`:"RANK —";

    const lv=p.level??p.playerLevel??p.ffLevel??basic.level??ff.level;
    $("proLevelReal").textContent=lv!==undefined&&lv!==null&&lv!==""?`LV ${lv}`:"LV —";
  }
  function renderExtra(p){const xp=num(p.proXP),start=p.proStartedAt||p.proStartDate;let days="—";if(start){const d=new Date(start);if(!isNaN(d))days=Math.max(0,Math.floor((Date.now()-d)/86400000))}$("membershipDays").textContent=days;$("proDays").textContent=days==="—"?"Active":`${days} days`;$("visitorTotal").textContent=num(p.profileViews).toLocaleString();$("visitorBattle").textContent=num(p.proBattles).toLocaleString();$("visitorXp").textContent=`${Math.round((xp%1000)/10)}%`;const games=Array.isArray(p.games)?p.games:Array.isArray(p.gameCenter)?p.gameCenter:[];$("gameSummary").textContent=games.length?`${games.length} selected game${games.length>1?'s':''} on your profile.`:"Selected games will appear here.";$("clipSummary").textContent=p.featuredClipId?"Featured clip selected.":"Pin your best moments.";$("gallerySummary").textContent=p.featuredGalleryId?"Featured gallery item selected.":"Feature your best visual content.";$("pinState").textContent=p.proPinnedContent?"Featured content is pinned.":"Choose your signature content.";document.querySelectorAll("[data-title]").forEach(b=>b.classList.toggle("selected",b.dataset.title===(String(p.proTitle||"ELITE").toUpperCase())));$("auraToggle").checked=(p.proCustomization?.effects?.ambientGlow!==false);document.body.classList.toggle("no-aura",!$("auraToggle").checked);setStudioControls(studioStateFromPlayer(p))}
  function surpriseKey(){return`4fuProDrop:${state.player?.id||"x"}:${new Date().toISOString().slice(0,10)}`}
  const drops=[{t:"NEON AURA BOOST",d:"A limited visual aura has been unlocked for your PRO identity.",v:"AURA • LIMITED"},{t:"XP SURGE",d:"A bonus XP drop landed in your PRO account.",v:"+250 XP"},{t:"SIGNATURE CARD",d:"Your profile card has entered Signature mode for today.",v:"SIGNATURE CARD"},{t:"SECRET TITLE",d:"A temporary premium title token is waiting.",v:"ELITE TOKEN"},{t:"PRO SHOWCASE BOOST",d:"Your next featured-content slot gets a special boost.",v:"SHOWCASE BOOST"}];
  function showReward(r){$("rewardTitle").textContent=r.t;$("rewardDescription").textContent=r.d;$("rewardValue").textContent=r.v;$("rewardModal").classList.add("open")}
  function openDrop(){if(!state.player)return;const key=surpriseKey();if(localStorage.getItem(key)){toast("Today's PRO Drop is already opened. Come back tomorrow 🔥");return}const r=drops[(new Date().getDate()+state.player.id.length)%drops.length];localStorage.setItem(key,JSON.stringify(r));const count=num(localStorage.getItem(`4fuProDrops:${state.player.id}`))+1;localStorage.setItem(`4fuProDrops:${state.player.id}`,count);$("rewardCount").textContent=count;showReward(r)}
  function secret(){const d=(new Date().getDate()+String(state.player?.id||"").length)%3;if(d===0){$("secretTitle").textContent="HIDDEN HIGHLIGHT";$("secretText").textContent="Open your PRO showcase and pin one signature clip."}else if(d===1){$("secretTitle").textContent="PROFILE HUNT";$("secretText").textContent="Get your next 10 profile views to reveal a bonus."}else{$("secretTitle").textContent="BATTLE CODE";$("secretText").textContent="Complete a player comparison today to reveal the next clue."}$("secretBtn").textContent="Revealed";toast("Secret mission discovered 🤫")}
  async function compare(){const id=$("battlePlayerId").value.trim();if(!id)return toast("Player ID enter karo.");const D=getDb();if(!D)return toast("Firebase connection not found.");try{const d=await D.collection("players").doc(id).get();if(!d.exists)return toast("Player nahi mila.");const other=d.data(),a=stats(state.player),b=stats(other);$("battleResult").innerHTML=`<div class="fighter"><b>${esc(playerName(state.player))}</b><span>K/D ${esc(a.kd??"—")} • HS ${esc(a.headshot??"—")} • ${esc(a.matches??"—")} matches</span></div><div class="vs">VS</div><div class="fighter"><b>${esc(playerName(other))}</b><span>K/D ${esc(b.kd??"—")} • HS ${esc(b.headshot??"—")} • ${esc(b.matches??"—")} matches</span></div>`;try{await D.collection("players").doc(state.player.id).update({proBattles:firebase.firestore.FieldValue.increment(1)})}catch(_){}state.player.proBattles=num(state.player.proBattles)+1;$("battles").textContent=state.player.proBattles;$("visitorBattle").textContent=state.player.proBattles;toast("Battle comparison ready ⚔️")}catch(_){toast("Comparison load nahi hua.")}}
  async function saveTitle(btn){const title=btn.dataset.title;document.querySelectorAll("[data-title]").forEach(x=>x.classList.toggle("selected",x===btn));try{await getDb().collection("players").doc(state.player.id).update({proTitle:title});state.player.proTitle=title;$("proTitle").textContent=title;$("shareMeta").textContent=`4FU PRO • ${title}`;toast(`${title} selected.`)}catch(_){toast("Title save nahi hua. Firestore rules check karo.")}}
  async function pin(){try{await getDb().collection("players").doc(state.player.id).update({proPinnedContent:true});state.player.proPinnedContent=true;renderExtra(state.player);toast("Featured content pinned 📌")}catch(_){toast("Pin save nahi hua. Firestore rules check karo.")}}
  async function recordView(){try{const D=getDb();if(!D||!state.player?.id)return;await D.collection("players").doc(state.player.id).update({profileViews:firebase.firestore.FieldValue.increment(1)});state.player.profileViews=num(state.player.profileViews)+1;$("views").textContent=state.player.profileViews.toLocaleString()}catch(_){}}
  async function load(){const A=getAuth(),D=getDb();if(!A||!D)return toast("4FU Firebase connection not found.");A.onAuthStateChanged(async user=>{if(!user){location.href="./player-login.html";return}state.user=user;try{
      let snap=await D.collection("players").where("loginEmail","==",user.email).limit(1).get();if(snap.empty)snap=await D.collection("players").where("uid","==",user.uid).limit(1).get();if(snap.empty)throw Error("Player profile not found.");state.player={id:snap.docs[0].id,...snap.docs[0].data()};
        const proActive=await checkProEntitlement();
        if(!proActive) return;

        // Firestore is the first source. If the stored player document does
        // not contain FF career stats, read the EXISTING saved B2 snapshot
        // through the 4FU Worker. No live refresh is requested.
        const existingStats = stats(state.player);
        const playerUid = state.player.uid || state.player.freeFireUid || state.player.playerUid;

        console.info("[4FU PRO V11] Firestore stats check", {
          uid: playerUid,
          kd: existingStats.kd,
          matches: existingStats.matches,
          wins: existingStats.wins
        });

        if (playerUid && (existingStats.kd == null || existingStats.matches == null || existingStats.wins == null)) {
          const savedFF = await loadSavedFreeFireData(
            playerUid,
            state.player.region || "IND"
          );
          if (savedFF) state.player = applySavedFreeFireData(state.player, savedFF);
        }

        render(state.player);$("rewardCount").textContent=num(localStorage.getItem(`4fuProDrops:${state.player.id}`));const key=surpriseKey();if(localStorage.getItem(key)){$("dropTitle").textContent="DROP CLAIMED";$("dropText").textContent="Today's surprise is already unlocked. New drop tomorrow.";$("openDrop").innerHTML='<i class="fa-solid fa-check"></i> Claimed'}recordView()}catch(e){console.error(e);toast(e.message||"Unable to load PRO profile.")}})}
  $("sharePro")?.addEventListener("click",async()=>{const url=state.player?.id?profileUrl(state.player.id):location.href;try{if(navigator.share)await navigator.share({title:"4FU PRO",text:"Check my 4FU PRO player profile.",url});else{await navigator.clipboard.writeText(url);toast("PRO link copied.")}}catch(e){if(e.name!=="AbortError")toast("Share cancelled.")}});
  $("copyProLink")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(profileUrl(state.player.id));toast("PRO profile link copied 🔗")}catch(_){toast(profileUrl(state.player.id))}});
  $("shareCard")?.addEventListener("click",()=>$("sharePro")?.click());
  initStudio();
  document.querySelectorAll(".theme").forEach(b=>b.addEventListener("click",()=>theme(b.dataset.theme)));
  document.querySelectorAll("[data-title]").forEach(b=>b.addEventListener("click",()=>saveTitle(b)));
  $("auraToggle")?.addEventListener("change",e=>{document.querySelector("[data-effect=ambientGlow]")?.toggleAttribute("checked",e.target.checked);document.body.classList.toggle("no-aura",!e.target.checked)});
  $("comparePlayer")?.addEventListener("click",compare);$("openDrop")?.addEventListener("click",openDrop);$("secretBtn")?.addEventListener("click",secret);$("pinContent")?.addEventListener("click",pin);$("closeModal")?.addEventListener("click",()=>$("rewardModal").classList.remove("open"));$("modalDone")?.addEventListener("click",()=>$("rewardModal").classList.remove("open"));$("rewardModal")?.addEventListener("click",e=>{if(e.target===$("rewardModal"))$("rewardModal").classList.remove("open")});
  $("getProBtn")?.addEventListener("click",()=>{ $("proPaywall")?.removeAttribute("hidden"); document.body.classList.add("pro-locked"); });
  $("payProBtn")?.addEventListener("click",startProPayment);
  const q=new URLSearchParams(location.search);load();
})();
