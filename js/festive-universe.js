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
  function parseScheduleInstant(value){
    if(typeof value!=="string"||!value.trim())return NaN;
    const normalized=value.trim();
    const local=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(normalized);
    if(!local){const parsed=Date.parse(normalized);return Number.isFinite(parsed)?parsed:NaN;}
    const year=Number(local[1]),month=Number(local[2]),day=Number(local[3]),hour=Number(local[4]),minute=Number(local[5]),second=Number(local[6]||0),millisecond=local[7]?Number(local[7].padEnd(3,"0")):0;
    if(year<1000||month<1||month>12||hour>23||minute>59||second>59||millisecond>999)return NaN;
    const calendar=new Date(Date.UTC(year,month-1,day));
    if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()!==month-1||calendar.getUTCDate()!==day)return NaN;
    const instant=Date.UTC(year,month-1,day,hour,minute,second,millisecond)-330*60*1000;
    return Number.isFinite(instant)?instant:NaN;
  }
  let activeKey=null,boundaryTimer=null,liveConfig=null;
  const safeText=(value,fallback,max)=>typeof value==="string"&&value.trim()?value.trim().slice(0,max):fallback;
  const safeColor=(value,fallback)=>typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
  const themeFor=key=>{
    const base=FESTIVALS[key]||{emoji:"✦",title:"A New Celebration",label:"CELEBRATION",message:"A new celebration begins.",particle:"fu-spark",count:18,caption:"CELEBRATION • UNITY • JOY",accent:"#ffb35c",atmosphere:"#24170c"};
    const f=liveLibrary.find(x=>x.id===key);
    if(!f)return base;
    const name=safeText(f.name,base.title,60);
    const particles={spark:"fu-spark",splash:"fu-holi-splash",snow:"fu-snow",lantern:"fu-lantern",confetti:"fu-confetti",web:"fu-web",leaf:"fu-leaf",none:"fu-none"};
    const intensities={low:9,medium:19,high:32};
    return {...base,title:name,label:safeText(f.label,base.label,70),message:safeText(f.message,base.message,150),particle:Object.prototype.hasOwnProperty.call(particles,f.particle)?particles[f.particle]:base.particle,count:Object.prototype.hasOwnProperty.call(intensities,f.intensity)?intensities[f.intensity]:base.count,caption:name.toUpperCase()+" • 4FU UNITED",style:["diwali","holi","winter","celestial","tricolour","midnight","fireworks","custom"].includes(f.style)?f.style:"custom",accent:safeColor(f.accent,base.accent||"#ffb35c"),atmosphere:safeColor(f.atmosphere,base.atmosphere||"#24170c")};
  };
  function activeForDate(config,now=Date.now()){
    const scheduled=liveLibrary.filter(f=>{
      if(!f||f.enabled!==true||!valid(f.id))return false;
      if(f.mode==="manual")return true;
      if(f.mode!=="scheduled")return false;
      const start=parseScheduleInstant(f.startAt),end=parseScheduleInstant(f.endAt);
      return Number.isFinite(start)&&Number.isFinite(end)&&end>start&&now>=start&&now<end;
    }).sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0));
    if(scheduled.length)return scheduled[0].id;
    if(!config||config.enabled!==true||!valid(config.festival))return null;
    if(config.mode==="manual")return config.festival;
    if(config.mode!=="scheduled")return null;
    const start=parseScheduleInstant(config.startAt),end=parseScheduleInstant(config.endAt);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||now<start||now>=end)return null;
    return config.festival;
  }
  function removeExperience(){
    const previousArt=document.getElementById("fourfu-festival-art");if(previousArt&&previousArt._resize)window.removeEventListener("resize",previousArt._resize);
    Array.from(document.documentElement.classList).forEach(name=>{if(name.startsWith("fu-festival-"))document.documentElement.classList.remove(name);});
    ["fourfu-festival-layer","fourfu-festival-art","fourfu-festival-toast","fourfu-festival-intro"].forEach(id=>document.getElementById(id)?.remove());
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
      const resize=()=>{const dpr=Math.min(1.5,window.devicePixelRatio||1);canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)};resize();art._resize=resize;window.addEventListener("resize",resize,{passive:true});
      const bursts=[];let last=0;const palette=key==="diwali"?["#ffd47b","#fff0c2","#ff9d45","#f6b6ff"]:["#ffcf6e","#8edcff","#ff83b7","#c6a3ff"];
      const frame=now=>{if(!art.isConnected)return;const w=innerWidth,h=innerHeight;if(now-last>1050&&bursts.length<5){last=now;const x=w*(.14+Math.random()*.72),y=h*(.1+Math.random()*.42),color=palette[Math.floor(Math.random()*palette.length)];for(let i=0;i<48;i++){const a=Math.PI*2*i/48+Math.random()*.08,s=1.1+Math.random()*3.2;bursts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:.008+Math.random()*.012,color,r:1+Math.random()*1.6})}}
        ctx.clearRect(0,0,w,h);for(let i=bursts.length-1;i>=0;i--){const p=bursts[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.018;p.vx*=.992;p.life-=p.decay;if(p.life<=0){bursts.splice(i,1);continue}ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;ctx.shadowBlur=0;requestAnimationFrame(frame)};requestAnimationFrame(frame);
    }
  }
  function build(key,isPreview=false){
    if(!valid(key)||activeKey===key)return;
    removeExperience();
    const theme=themeFor(key),styleKey=({diwali:"diwali",holi:"holi",winter:"christmas",celestial:"eid",tricolour:"independence",midnight:"halloween",fireworks:"newyear"})[theme.style]||key;
    activeKey=key;document.documentElement.classList.add("fu-festival-"+key);
    if(styleKey!==key&&/^[a-z0-9-]{2,40}$/.test(styleKey))document.documentElement.classList.add("fu-festival-"+styleKey);
    if(theme.accent&&/^#[0-9a-f]{6}$/i.test(theme.accent))document.documentElement.style.setProperty("--fu-accent",theme.accent);
    if(theme.atmosphere&&/^#[0-9a-f]{6}$/i.test(theme.atmosphere))document.documentElement.style.setProperty("--fu-wash",theme.atmosphere);
    if(theme.style)document.documentElement.classList.add("fu-style-"+theme.style);
    const layer=document.createElement("div");layer.id="fourfu-festival-layer";layer.setAttribute("aria-hidden","true");
    if(!reducedMotion&&styleKey!=="holi"){
      for(let i=0;i<theme.count;i++){
        const p=document.createElement("span");p.className="fu-festival-particle "+theme.particle;
        p.style.setProperty("--x",Math.random()*100+"vw");p.style.setProperty("--duration",10+Math.random()*15+"s");p.style.setProperty("--delay",-Math.random()*20+"s");p.style.setProperty("--drift",-75+Math.random()*150+"px");p.style.setProperty("--alpha",(0.2+Math.random()*.42).toFixed(2));p.style.setProperty("--rot",Math.round(Math.random()*180)+"deg");
        if(styleKey==="holi")p.style.background=["#ff4e9b","#ffc247","#38d8c5","#8c75ff","#ff794d"][i%5];
        if(styleKey==="newyear"||styleKey==="independence")p.style.background=styleKey==="independence"?["#ff9933","#fff","#138808"][i%3]:["#ffca55","#8fd7ff","#ff7eb6","#b49aff"][i%4];
        if(styleKey==="eid")p.style.animationDuration=(14+Math.random()*9)+"s";
        layer.appendChild(p);
      }
    }
    document.body.appendChild(layer);
    addFestivalArt(styleKey);
    let welcomed=false;const welcomeKey="fu-festival-welcomed:"+key;
    if(!isPreview){try{welcomed=sessionStorage.getItem(welcomeKey)==="1";}catch(_){}}
    if(!welcomed){
      const toast=document.createElement("div");toast.id="fourfu-festival-toast";toast.className="fu-festival-toast";toast.setAttribute("role","status");toast.textContent=theme.emoji+" "+theme.message;document.body.appendChild(toast);
      if(!isPreview){try{sessionStorage.setItem(welcomeKey,"1");}catch(_){}}
      window.setTimeout(()=>toast.remove(),6500);
    }
    if(["diwali","holi","christmas","newyear","eid","independence","halloween"].includes(styleKey)){
      let seen=false;if(!isPreview){try{seen=sessionStorage.getItem("fu-festival-intro:"+key)==="1";}catch(_){}}
      if(!seen){addIntro(styleKey);if(!isPreview){try{sessionStorage.setItem("fu-festival-intro:"+key,"1");}catch(_){}}}
    }
  }
  function applyLiveConfig(){
    if(!liveConfig&&(!liveLibrary||!liveLibrary.length))return;
    if(boundaryTimer!==null)window.clearTimeout(boundaryTimer);boundaryTimer=null;
    const now=Date.now(),nextKey=activeForDate(liveConfig,now);
    if(nextKey)build(nextKey);else if(activeKey)removeExperience();
    const boundaries=[];(liveLibrary||[]).forEach(f=>{if(f.enabled&&f.mode==="scheduled"){const a=parseScheduleInstant(f.startAt),b=parseScheduleInstant(f.endAt);if(Number.isFinite(a)&&a>now)boundaries.push(a);if(Number.isFinite(b)&&b>now)boundaries.push(b);}});
    if(liveConfig&&liveConfig.enabled===true&&liveConfig.mode==="scheduled"){const a=parseScheduleInstant(liveConfig.startAt),b=parseScheduleInstant(liveConfig.endAt);if(Number.isFinite(a)&&a>now)boundaries.push(a);if(Number.isFinite(b)&&b>now)boundaries.push(b);}
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

  // FESTIVAL INTERACTIONS — contextual celebrations on real user actions.
  // Effects are decorative only: they never block clicks, navigation, or form controls.
  function installFestivalInteractions(){
    if(window.__4fuFestivalInteractionsInstalled)return;
    window.__4fuFestivalInteractionsInstalled=true;
    const style=document.createElement("style");style.id="fu-interaction-style";
    style.textContent=`
      .fu-interaction-fx{position:fixed;inset:0;z-index:1200;pointer-events:none;overflow:hidden}
      .fu-burst-particle{position:absolute;left:var(--sx);top:var(--sy);width:var(--size);height:var(--size);border-radius:var(--shape,50%);background:var(--color);box-shadow:0 0 12px var(--color);opacity:0;animation:fuBurstFly var(--life,950ms) cubic-bezier(.12,.72,.22,1) forwards}
      @keyframes fuBurstFly{0%{opacity:0;transform:translate(-50%,-50%) scale(.25) rotate(0)}12%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.12) rotate(var(--turn,240deg))}}
      .fu-rocket{position:absolute;width:4px;height:34px;border-radius:9px;background:linear-gradient(#fff7b0,#ff9c36);box-shadow:0 0 14px #ffc65c;animation:fuRocket 430ms ease-out forwards}
      @keyframes fuRocket{to{transform:translate(var(--rx),var(--ry));opacity:.25}}
      .fu-card-celebrate{animation:fuCardCelebrate 720ms cubic-bezier(.2,.8,.2,1)}
      @keyframes fuCardCelebrate{0%,100%{filter:none}25%{filter:drop-shadow(0 0 16px var(--fu-accent,#ffc15b))}55%{filter:brightness(1.13) saturate(1.25)}}
      .fu-holi-splash{position:absolute;width:clamp(90px,18vw,210px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,var(--splash) 0 9%,color-mix(in srgb,var(--splash),transparent 28%) 18%,transparent 72%);filter:blur(5px);transform:translate(-50%,-50%) scale(.2);animation:fuHoliSplash 850ms ease-out forwards}
      @keyframes fuHoliSplash{45%{opacity:.8}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
      .fu-balloon{position:absolute;width:20px;height:26px;border-radius:50% 50% 46% 46%;background:var(--color);box-shadow:inset -4px -5px 8px #0002;animation:fuBalloonPop 650ms ease-out forwards}
      @keyframes fuBalloonPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}35%{opacity:1;transform:translate(-50%,-80%) scale(1.25)}100%{opacity:0;transform:translate(-50%,-160%) scale(.1)}}
      .fu-fx-sparkle{position:absolute;font-size:22px;color:var(--color);text-shadow:0 0 16px var(--color);animation:fuSparkle 850ms ease-out forwards}
      @keyframes fuSparkle{0%{opacity:0;transform:translate(-50%,-50%) scale(.2) rotate(-35deg)}25%{opacity:1}100%{opacity:0;transform:translate(-50%,-110%) scale(1.5) rotate(45deg)}}
      @media(prefers-reduced-motion:reduce){.fu-interaction-fx,.fu-card-celebrate{display:none!important}}
    `;document.head.appendChild(style);
    const palettes={diwali:["#ffd36e","#fff0bf","#ff8b36","#f7b5e9"],holi:["#ff3e91","#ffc52e","#22d5c1","#8a68ff","#ff7548"],christmas:["#d9fff1","#e84d62","#f4d27a","#9ad7ff"],newyear:["#ffcf64","#7edbff","#ff78bd","#bba2ff"],eid:["#c9f4d9","#e9c77b","#a4d9ef"],independence:["#ff9933","#ffffff","#138808"],"republic-day":["#ff9933","#ffffff","#138808"],halloween:["#a77bff","#ff8b42","#c7d1ff"],navratri:["#ffb1d8","#ffc45c","#8d70ff"],"raksha-bandhan":["#f2a9c7","#f6d18b","#fff0d6"]};
    const symbols={christmas:["❄","✦","✧"],eid:["☾","✦","✧"],halloween:["✦","☠","✧"],navratri:["✦","✺","✧"],"raksha-bandhan":["♡","✦","❀"],independence:["✦","✧","❖"],"republic-day":["✦","✧","❖"]};
    function makeLayer(){let node=document.querySelector(".fu-interaction-fx");if(!node){node=document.createElement("div");node.className="fu-interaction-fx";node.setAttribute("aria-hidden","true");document.body.appendChild(node)}return node}
    function burst(x,y,key,target){
      if(reducedMotion||!key)return;
      const palette=palettes[key]||palettes.diwali,layer=makeLayer(),card=target?.closest("article,.player-card,.team-card,.card,[class*='player-card'],[class*='team-card']");
      if(card){card.classList.remove("fu-card-celebrate");void card.offsetWidth;card.classList.add("fu-card-celebrate");window.setTimeout(()=>card.classList.remove("fu-card-celebrate"),800)}
      const add=(el)=>{layer.appendChild(el);window.setTimeout(()=>el.remove(),1500)};
      if(key==="holi"){
        const splash=document.createElement("i");splash.className="fu-holi-splash";splash.style.left=x+"px";splash.style.top=y+"px";splash.style.setProperty("--splash",palette[Math.floor(Math.random()*palette.length)]);add(splash);
        for(let b=0;b<2;b++){const balloon=document.createElement("i");balloon.className="fu-balloon";balloon.style.left=(x+(Math.random()-.5)*90)+"px";balloon.style.top=(y+(Math.random()-.5)*65)+"px";balloon.style.setProperty("--color",palette[Math.floor(Math.random()*palette.length)]);add(balloon)}
      }else if(key==="diwali"||key==="newyear"){
        const rocket=document.createElement("i");rocket.className="fu-rocket";rocket.style.left=x+"px";rocket.style.top=(Math.min(innerHeight-30,y+Math.min(150,innerHeight*.22)))+"px";rocket.style.setProperty("--rx",(Math.random()-.5)*90+"px");rocket.style.setProperty("--ry",(y-parseFloat(rocket.style.top))+"px");add(rocket);
      }
      const count=key==="diwali"||key==="newyear"?42: key==="holi"?20:24;
      for(let i=0;i<count;i++){
        const p=document.createElement("i"),angle=Math.PI*2*i/count+(Math.random()-.5)*.22,distance=(key==="holi"?45:34)+Math.random()*(key==="holi"?105:92);
        p.className=(key==="holi"?"fu-burst-particle":"fu-burst-particle");p.style.left=x+"px";p.style.top=y+"px";p.style.setProperty("--sx","0px");p.style.setProperty("--sy","0px");p.style.setProperty("--dx",Math.cos(angle)*distance+"px");p.style.setProperty("--dy",Math.sin(angle)*distance+"px");p.style.setProperty("--size",(2+Math.random()*4)+"px");p.style.setProperty("--color",palette[i%palette.length]);p.style.setProperty("--life",(650+Math.random()*550)+"ms");if(key==="holi")p.style.setProperty("--shape",Math.random()>.5?"50%":"2px");add(p);
      }
      const glyphs=symbols[key]||["✦","✧","❖"];
      for(let i=0;i<3;i++){const s=document.createElement("b");s.className="fu-fx-sparkle";s.textContent=glyphs[i%glyphs.length];s.style.left=(x+(Math.random()-.5)*70)+"px";s.style.top=(y+(Math.random()-.5)*45)+"px";s.style.setProperty("--color",palette[i%palette.length]);add(s)}
    }
    document.addEventListener("click",event=>{
      if(!activeKey||!document.body)return;
      const target=event.target instanceof Element?event.target:null;if(!target)return;
      const trigger=target.closest("button,a,[role='button'],.player-card,.team-card,.card,[class*='player-card'],[class*='team-card']");
      if(!trigger||trigger.closest("#fourfu-festival-intro,.studio-preview-rail,.studio-global-preview"))return;
      if(trigger.matches("input,select,textarea")||trigger.closest("input,select,textarea"))return;
      const rect=trigger.getBoundingClientRect(),x=Math.max(8,Math.min(innerWidth-8,event.clientX||rect.left+rect.width/2)),y=Math.max(8,Math.min(innerHeight-8,event.clientY||rect.top+rect.height/2));
      const styleKey=({diwali:"diwali",holi:"holi",winter:"christmas",celestial:"eid",tricolour:"independence",midnight:"halloween",fireworks:"newyear"})[themeFor(activeKey).style]||activeKey;
      burst(x,y,styleKey,trigger);
    },{passive:true});
  }
  installFestivalInteractions();

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
