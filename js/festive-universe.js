/* 4FU FESTIVE UNIVERSE — premium festival experience */
(() => {
  "use strict";
  const FESTIVALS = {
    diwali:{emoji:"✦",title:"A Festival of Light",label:"HAPPY DIWALI",message:"May your world glow with light, joy and victory.",particle:"fu-spark",count:34,caption:"LIGHT • JOY • TOGETHERNESS"},
    holi:{emoji:"✦",title:"A Celebration of Colours",label:"HAPPY HOLI",message:"Let every colour bring a new reason to celebrate.",particle:"fu-holi-splash",count:18,caption:"COLOUR • ENERGY • UNITY"},
    christmas:{emoji:"✦",title:"The Season of Giving",label:"MERRY CHRISTMAS",message:"Wishing the entire 4FU family warmth and wonder.",particle:"fu-snow",count:38,caption:"PEACE • JOY • GOODWILL"},
    newyear:{emoji:"✦",title:"A New Chapter Begins",label:"HAPPY NEW YEAR",message:"New goals. New victories. One united 4FU.",particle:"fu-confetti",count:42,caption:"NEW BEGINNINGS • BIG WINS"},
    eid:{emoji:"🌙",title:"A Time for Togetherness",label:"EID MUBARAK",message:"May peace, prosperity and happiness be with you.",particle:"fu-lantern",count:22,caption:"PEACE • GRATITUDE • UNITY"},
    independence:{emoji:"✦",title:"Pride in Every Tricolour",label:"HAPPY INDEPENDENCE DAY",message:"Honouring courage, freedom and the spirit of India.",particle:"fu-confetti",count:30,caption:"COURAGE • FREEDOM • UNITY"},
    halloween:{emoji:"✦",title:"Enter the Night",label:"HAPPY HALLOWEEN",message:"A little mystery. A lot of 4FU spirit.",particle:"fu-web",count:22,caption:"MYSTERY • MAGIC • MAYHEM"}
  };
  Object.assign(FESTIVALS,{
    navratri:{emoji:"✦",title:"Nine Nights of Radiance",label:"HAPPY NAVRATRI",message:"Nine nights. Infinite energy. One spirit.",particle:"fu-spark",count:28,caption:"DEVOTION • RHYTHM • RADIANCE"},
    "raksha-bandhan":{emoji:"✦",title:"A Bond Beyond Battles",label:"HAPPY RAKSHA BANDHAN",message:"Celebrating the bonds that make us stronger.",particle:"fu-leaf",count:16,caption:"BOND • TRUST • TOGETHERNESS"},
    "republic-day":{emoji:"✦",title:"A Nation. A Constitution.",label:"HAPPY REPUBLIC DAY",message:"Many voices, one united spirit.",particle:"fu-confetti",count:30,caption:"UNITY • PRIDE • DEMOCRACY"}
  });
  const MAX_TIMER=2147483647;
  const reducedMotion=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const params=new URLSearchParams(window.location.search);
  const preview=params.get("festivalPreview");
  let liveLibrary=[];
  const valid=key=>Object.prototype.hasOwnProperty.call(FESTIVALS,key)||(/^[a-z0-9-]{2,40}$/.test(key)&&liveLibrary.some(f=>f.id===key&&f.custom===true));
  let activeKey=null,boundaryTimer=null,liveConfig=null;
  const themeFor=key=>{const base=FESTIVALS[key]||{emoji:"✦",title:"A New Celebration",label:"CELEBRATION",message:"A new celebration begins.",particle:"fu-spark",count:18,caption:"CELEBRATION • UNITY • JOY"};const f=liveLibrary.find(x=>x.id===key);if(!f)return base;const p={spark:"fu-spark",splash:"fu-holi-splash",snow:"fu-snow",lantern:"fu-lantern",confetti:"fu-confetti",web:"fu-web",none:"fu-none"};const n={low:9,medium:19,high:32};return {...base,title:f.name||base.title,label:f.label||base.label,message:f.message||base.message,particle:p[f.particle]||base.particle,count:n[f.intensity]||base.count,caption:(f.name||base.title).toUpperCase()+" • 4FU UNITED",style:["diwali","holi","winter","celestial","tricolour","midnight","fireworks","custom"].includes(f.style)?f.style:"custom",accent:f.accent,atmosphere:f.atmosphere};};
  const rangoliSvg='<svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#ffd17a" stroke-width="1.35" stroke-linecap="round"><circle cx="120" cy="120" r="105"/><circle cx="120" cy="120" r="84"/><circle cx="120" cy="120" r="62"/><circle cx="120" cy="120" r="38"/><path d="M120 15V225M15 120H225M46 46L194 194M194 46L46 194M82 24Q120 55 158 24Q145 65 120 78Q95 65 82 24ZM216 82Q185 120 216 158Q175 145 162 120Q175 95 216 82ZM158 216Q120 185 82 216Q95 175 120 162Q145 175 158 216ZM24 158Q55 120 24 82Q65 95 78 120Q65 145 24 158Z"/><path d="M120 38Q151 70 120 92Q89 70 120 38ZM202 120Q170 151 148 120Q170 89 202 120ZM120 202Q89 170 120 148Q151 170 120 202ZM38 120Q70 89 92 120Q70 151 38 120Z"/></g><g fill="#fff0bf"><circle cx="120" cy="15" r="3"/><circle cx="225" cy="120" r="3"/><circle cx="120" cy="225" r="3"/><circle cx="15" cy="120" r="3"/><circle cx="120" cy="120" r="4"/></g></svg>';
  function activeForDate(config,now=Date.now()){
    const scheduled=liveLibrary.filter(f=>f&&f.enabled===true&&valid(f.id)).filter(f=>f.mode==="manual"||(f.mode==="scheduled"&&Number.isFinite(Date.parse(f.startAt||""))&&Number.isFinite(Date.parse(f.endAt||""))&&Date.parse(f.endAt)>Date.parse(f.startAt)&&now>=Date.parse(f.startAt)&&now<Date.parse(f.endAt))).sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0));
    if(scheduled.length)return scheduled[0].id;
    if(!config||config.enabled!==true||!valid(config.festival))return null;
    if(config.mode==="manual")return config.festival;
    if(config.mode!=="scheduled")return null;
    const start=Date.parse(config.startAt||""),end=Date.parse(config.endAt||"");
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||now<start||now>=end)return null;
    return config.festival;
  }
  function removeExperience(){
    Array.from(document.documentElement.classList).forEach(name=>{if(name.startsWith("fu-festival-"))document.documentElement.classList.remove(name);});
    ["fourfu-festival-layer","fourfu-festival-art","fourfu-festival-toast","fourfu-festival-diya-left","fourfu-festival-diya-right","fourfu-festival-rangoli","fourfu-festival-moon","fourfu-festival-intro"].forEach(id=>document.getElementById(id)?.remove());
    document.documentElement.style.removeProperty("--fu-accent");document.documentElement.style.removeProperty("--fu-wash");
    Array.from(document.documentElement.classList).forEach(name=>{if(name.startsWith("fu-style-"))document.documentElement.classList.remove(name);});activeKey=null;
  }
  function addIntro(key){
    const theme=themeFor(key),intro=document.createElement("section"),content=document.createElement("div"),art=document.createElement("div"),kicker=document.createElement("p"),title=document.createElement("h1"),caption=document.createElement("p"),skipButton=document.createElement("button");
    intro.id="fourfu-festival-intro";intro.setAttribute("role","dialog");intro.setAttribute("aria-label",theme.label);
    content.className="fu-intro-content";art.className="fu-intro-art fu-intro-art-"+key;art.dataset.festival=key;kicker.className="fu-intro-kicker";kicker.textContent="4 FIRE UNITED PRESENTS";title.className="fu-intro-title";title.textContent=theme.title;caption.className="fu-intro-caption";caption.textContent=theme.caption;skipButton.className="fu-intro-skip";skipButton.type="button";skipButton.textContent="Skip intro";content.append(art,kicker,title,caption);intro.append(content,skipButton);
    document.body.appendChild(intro);
    const close=()=>{intro.classList.add("is-leaving");window.setTimeout(()=>intro.remove(),800);};
    const skip=intro.querySelector?.("button");if(skip)skip.addEventListener("click",close,{once:true});
    window.setTimeout(close,3200);
  }
  function addFestivalArt(key){
    if(reducedMotion)return;
    if(!document.getElementById("fu-festival-art-style")){
      const style=document.createElement("style");style.id="fu-festival-art-style";
      style.textContent=`
      #fourfu-festival-art{position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden}
      #fourfu-festival-art canvas{width:100%;height:100%;display:block}
      .fu-powder-cloud{position:absolute;width:38vw;height:34vw;max-width:520px;max-height:460px;border-radius:50%;filter:blur(34px);opacity:.2;mix-blend-mode:screen;animation:fuPowderDrift 13s ease-in-out infinite alternate}
      .fu-powder-cloud:nth-child(1){left:-10%;top:12%;background:radial-gradient(circle,#ff3b8d 0 13%,#ff3b8d00 70%)}
      .fu-powder-cloud:nth-child(2){right:-12%;top:8%;background:radial-gradient(circle,#24d9c4 0 14%,#24d9c400 70%);animation-delay:-4s}
      .fu-powder-cloud:nth-child(3){left:25%;bottom:-22%;background:radial-gradient(circle,#ffc247 0 16%,#ffc24700 70%);animation-delay:-7s}
      .fu-powder-cloud:nth-child(4){right:18%;bottom:-18%;background:radial-gradient(circle,#9b70ff 0 14%,#9b70ff00 70%);animation-delay:-2s}
      .fu-powder-cloud:nth-child(5){left:-15%;bottom:18%;background:radial-gradient(circle,#ff784b 0 15%,#ff784b00 70%);animation-delay:-9s}
      .fu-art-eid:after{content:"☾";position:absolute;right:12%;top:13%;font:200px/1 Georgia,serif;color:#d8f4e9;opacity:.22;text-shadow:0 0 45px #9df5db}
      .fu-art-navratri:before{content:"";position:absolute;width:min(52vw,560px);aspect-ratio:1;left:50%;bottom:-44%;transform:translateX(-50%);border:1px solid #f3a4d766;border-radius:50%;box-shadow:0 0 0 22px #f3a4d711,0 0 0 48px #f3a4d70b,0 0 80px #f3a4d733}
      .fu-art-raksha-bandhan:before{content:"";position:absolute;left:-8%;right:-8%;top:18%;height:2px;background:linear-gradient(90deg,transparent,#e7a4c8aa,#ffd9a5aa,#e7a4c8aa,transparent);box-shadow:0 0 24px #e7a4c8}
      .fu-art-independence:before,.fu-art-republic-day:before{content:"";position:absolute;inset:0;background:linear-gradient(165deg,transparent 22%,#ff993311 30%,transparent 42%,transparent 54%,#fff2 61%,transparent 70%,transparent 78%,#13880811 86%,transparent 94%);transform:skewY(-8deg)}
      .fu-art-christmas:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% -20%,#b8f6e522,transparent 55%),radial-gradient(ellipse at 0 100%,#75d8ae18,transparent 45%)}
      .fu-art-halloween:before{content:"";position:absolute;right:12%;top:12%;width:140px;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 38% 35%,#d7c5ff55,#9c6cff11 65%,transparent 70%);box-shadow:0 0 70px #9b6cff33}
      @keyframes fuPowderDrift{from{transform:translate3d(-2vw,2vh,0) scale(.86)}to{transform:translate3d(5vw,-4vh,0) scale(1.16)}}
      @media(max-width:700px){.fu-powder-cloud{width:65vw;height:65vw;filter:blur(26px);opacity:.15}}
      @media(prefers-reduced-motion:reduce){#fourfu-festival-art{display:none!important}}
      `;document.head.appendChild(style);
    }
    const art=document.createElement("div");art.id="fourfu-festival-art";art.className="fu-art fu-art-"+key;art.setAttribute("aria-hidden","true");document.body.appendChild(art);
    if(key==="holi"){for(let i=0;i<5;i++){const cloud=document.createElement("span");cloud.className="fu-powder-cloud";art.appendChild(cloud)}return}
    if(key==="diwali"||key==="newyear"){
      const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");art.appendChild(canvas);
      const resize=()=>{const dpr=Math.min(1.5,window.devicePixelRatio||1);canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)};resize();window.addEventListener("resize",resize,{passive:true});
      const bursts=[];let last=0;const palette=key==="diwali"?["#ffd47b","#fff0c2","#ff9d45","#f6b6ff"]:["#ffcf6e","#8edcff","#ff83b7","#c6a3ff"];
      const frame=now=>{if(!art.isConnected)return;const w=innerWidth,h=innerHeight;if(now-last>1050&&bursts.length<5){last=now;const x=w*(.14+Math.random()*.72),y=h*(.1+Math.random()*.42),color=palette[Math.floor(Math.random()*palette.length)];for(let i=0;i<48;i++){const a=Math.PI*2*i/48+Math.random()*.08,s=1.1+Math.random()*3.2;bursts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:.008+Math.random()*.012,color,r:1+Math.random()*1.6})}}
        ctx.clearRect(0,0,w,h);for(let i=bursts.length-1;i>=0;i--){const p=bursts[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.018;p.vx*=.992;p.life-=p.decay;if(p.life<=0){bursts.splice(i,1);continue}ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;ctx.shadowBlur=0;requestAnimationFrame(frame)};requestAnimationFrame(frame);
    }
  }
  function addRangoli(){
    const wrap=document.createElement("div");wrap.id="fourfu-festival-rangoli";wrap.className="fu-rangoli";wrap.setAttribute("aria-hidden","true");wrap.innerHTML=rangoliSvg;document.body.appendChild(wrap);
  }
  function build(key,isPreview=false){
    if(!valid(key)||activeKey===key)return;
    removeExperience();
    const theme=themeFor(key);activeKey=key;document.documentElement.classList.add("fu-festival-"+key);
    if(theme.accent&&/^#[0-9a-f]{6}$/i.test(theme.accent))document.documentElement.style.setProperty("--fu-accent",theme.accent);
    if(theme.atmosphere&&/^#[0-9a-f]{6}$/i.test(theme.atmosphere))document.documentElement.style.setProperty("--fu-wash",theme.atmosphere);
    if(theme.style)document.documentElement.classList.add("fu-style-"+theme.style);
    const layer=document.createElement("div");layer.id="fourfu-festival-layer";layer.setAttribute("aria-hidden","true");
    if(!reducedMotion&&key!=="holi"){
      for(let i=0;i<theme.count;i++){
        const p=document.createElement("span");p.className="fu-festival-particle "+theme.particle;
        p.style.setProperty("--x",Math.random()*100+"vw");p.style.setProperty("--duration",10+Math.random()*15+"s");p.style.setProperty("--delay",-Math.random()*20+"s");p.style.setProperty("--drift",-75+Math.random()*150+"px");p.style.setProperty("--alpha",(0.2+Math.random()*.42).toFixed(2));p.style.setProperty("--rot",Math.round(Math.random()*180)+"deg");
        if(key==="holi")p.style.background=["#ff4e9b","#ffc247","#38d8c5","#8c75ff","#ff794d"][i%5];
        if(key==="newyear"||key==="independence")p.style.background=key==="independence"?["#ff9933","#fff","#138808"][i%3]:["#ffca55","#8fd7ff","#ff7eb6","#b49aff"][i%4];
        if(key==="eid")p.style.animationDuration=(14+Math.random()*9)+"s";
        layer.appendChild(p);
      }
    }
    document.body.appendChild(layer);
    addFestivalArt(key);
    let welcomed=false;const welcomeKey="fu-festival-welcomed:"+key;
    if(!isPreview){try{welcomed=sessionStorage.getItem(welcomeKey)==="1";}catch(_){}}
    if(!welcomed){
      const toast=document.createElement("div");toast.id="fourfu-festival-toast";toast.className="fu-festival-toast";toast.setAttribute("role","status");toast.textContent=theme.emoji+" "+theme.message;document.body.appendChild(toast);
      if(!isPreview){try{sessionStorage.setItem(welcomeKey,"1");}catch(_){}}
      window.setTimeout(()=>toast.remove(),6500);
    }
    if(key==="diwali"||key==="holi"||key==="christmas"||key==="newyear"||key==="eid"||key==="independence"||key==="halloween"){
      let seen=false;if(!isPreview){try{seen=sessionStorage.getItem("fu-festival-intro:"+key)==="1";}catch(_){}}
      if(!seen){addIntro(key);if(!isPreview){try{sessionStorage.setItem("fu-festival-intro:"+key,"1");}catch(_){}}}
    }
  }
  function applyLiveConfig(){
    if(!liveConfig&&(!liveLibrary||!liveLibrary.length))return;
    if(boundaryTimer!==null)window.clearTimeout(boundaryTimer);boundaryTimer=null;
    const now=Date.now(),nextKey=activeForDate(liveConfig,now);
    if(nextKey)build(nextKey);else if(activeKey)removeExperience();
    const boundaries=[];(liveLibrary||[]).forEach(f=>{if(f.enabled&&f.mode==="scheduled"){const a=Date.parse(f.startAt||""),b=Date.parse(f.endAt||"");if(Number.isFinite(a)&&a>now)boundaries.push(a);if(Number.isFinite(b)&&b>now)boundaries.push(b);}});
    if(liveConfig&&liveConfig.enabled===true&&liveConfig.mode==="scheduled"){const a=Date.parse(liveConfig.startAt||""),b=Date.parse(liveConfig.endAt||"");if(Number.isFinite(a)&&a>now)boundaries.push(a);if(Number.isFinite(b)&&b>now)boundaries.push(b);}
    if(boundaries.length){const next=Math.min(...boundaries);boundaryTimer=window.setTimeout(applyLiveConfig,Math.min(MAX_TIMER,Math.max(0,next-now+25)));}
  }
  window.addEventListener("4fu:studio-preview",event=>{
    if(!params.has("studioPreview"))return;
    const detail=event.detail||{};if(Array.isArray(detail.festivalLibrary))liveLibrary=detail.festivalLibrary;
    const chosen=liveLibrary.find(f=>f.id===detail.selectedFestival);
    if(chosen){removeExperience();if(valid(chosen.id))build(chosen.id,true);}
  });
  function start(){
    if(params.has("festivalPreview")){
      const raw=params.get("festivalPreviewData");
      if(raw&&raw.length<=6000){try{const f=JSON.parse(raw);if(f&&typeof f==="object"&&typeof f.id==="string"&&f.id===preview&&/^[a-z0-9-]{2,40}$/.test(f.id)){f.custom=f.custom===true;f.name=String(f.name||"Celebration").slice(0,60);f.label=String(f.label||"CELEBRATION").slice(0,70);f.message=String(f.message||"A new celebration begins.").slice(0,150);if(!/^#[0-9a-f]{6}$/i.test(f.accent||""))f.accent="";if(!/^#[0-9a-f]{6}$/i.test(f.atmosphere||""))f.atmosphere="";liveLibrary=[...liveLibrary.filter(x=>x.id!==f.id),f];} }catch(_){}}
      if(valid(preview))build(preview,true);return;
    }
    if(params.has("studioPreview"))return; // Studio iframe never reads or mutates live festival state.
    if(typeof db==="undefined"||!db.collection)return;
    db.collection("settings").doc("website").get().then(doc=>{if(!doc.exists)return;liveConfig=doc.data().festival||null;liveLibrary=Array.isArray(doc.data().experience?.festivalLibrary)?doc.data().experience.festivalLibrary:[];applyLiveConfig();}).catch(err=>console.warn("[4FU Festive Universe] Could not load festival settings:",err));
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")applyLiveConfig();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
