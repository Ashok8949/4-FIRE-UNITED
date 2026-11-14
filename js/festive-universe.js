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
  const MAX_TIMER=2147483647;
  const reducedMotion=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const params=new URLSearchParams(window.location.search);
  const preview=params.get("festivalPreview");
  const valid=key=>Object.prototype.hasOwnProperty.call(FESTIVALS,key);
  let activeKey=null,boundaryTimer=null,liveConfig=null;
  const rangoliSvg='<svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#ffd17a" stroke-width="1.35" stroke-linecap="round"><circle cx="120" cy="120" r="105"/><circle cx="120" cy="120" r="84"/><circle cx="120" cy="120" r="62"/><circle cx="120" cy="120" r="38"/><path d="M120 15V225M15 120H225M46 46L194 194M194 46L46 194M82 24Q120 55 158 24Q145 65 120 78Q95 65 82 24ZM216 82Q185 120 216 158Q175 145 162 120Q175 95 216 82ZM158 216Q120 185 82 216Q95 175 120 162Q145 175 158 216ZM24 158Q55 120 24 82Q65 95 78 120Q65 145 24 158Z"/><path d="M120 38Q151 70 120 92Q89 70 120 38ZM202 120Q170 151 148 120Q170 89 202 120ZM120 202Q89 170 120 148Q151 170 120 202ZM38 120Q70 89 92 120Q70 151 38 120Z"/></g><g fill="#fff0bf"><circle cx="120" cy="15" r="3"/><circle cx="225" cy="120" r="3"/><circle cx="120" cy="225" r="3"/><circle cx="15" cy="120" r="3"/><circle cx="120" cy="120" r="4"/></g></svg>';
  function activeForDate(config,now=Date.now()){
    if(!config||config.enabled!==true||!valid(config.festival))return null;
    if(config.mode==="manual")return config.festival;
    if(config.mode!=="scheduled")return null;
    const start=Date.parse(config.startAt||""),end=Date.parse(config.endAt||"");
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||now<start||now>=end)return null;
    return config.festival;
  }
  function removeExperience(){
    Array.from(document.documentElement.classList).forEach(name=>{if(name.startsWith("fu-festival-"))document.documentElement.classList.remove(name);});
    ["fourfu-festival-layer","fourfu-festival-toast","fourfu-festival-diya-left","fourfu-festival-diya-right","fourfu-festival-rangoli","fourfu-festival-moon","fourfu-festival-intro"].forEach(id=>document.getElementById(id)?.remove());
    activeKey=null;
  }
  function addIntro(key){
    const theme=FESTIVALS[key],intro=document.createElement("section");
    intro.id="fourfu-festival-intro";intro.setAttribute("role","dialog");intro.setAttribute("aria-label",theme.label);
    intro.innerHTML='<div class="fu-intro-content"><div class="fu-intro-art">'+rangoliSvg+'</div><p class="fu-intro-kicker">4 FIRE UNITED PRESENTS</p><h1 class="fu-intro-title">'+theme.title+'</h1><p class="fu-intro-caption">'+theme.caption+'</p></div><button class="fu-intro-skip" type="button">Skip intro</button>';
    document.body.appendChild(intro);
    const close=()=>{intro.classList.add("is-leaving");window.setTimeout(()=>intro.remove(),800);};
    const skip=intro.querySelector?.("button");if(skip)skip.addEventListener("click",close,{once:true});
    window.setTimeout(close,3200);
  }
  function addRangoli(){
    const wrap=document.createElement("div");wrap.id="fourfu-festival-rangoli";wrap.className="fu-rangoli";wrap.setAttribute("aria-hidden","true");wrap.innerHTML=rangoliSvg;document.body.appendChild(wrap);
  }
  function build(key,isPreview=false){
    if(!valid(key)||activeKey===key)return;
    removeExperience();
    const theme=FESTIVALS[key];activeKey=key;document.documentElement.classList.add("fu-festival-"+key);
    const layer=document.createElement("div");layer.id="fourfu-festival-layer";layer.setAttribute("aria-hidden","true");
    if(!reducedMotion){
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
    if(key==="diwali"){
      const left=document.createElement("span"),right=document.createElement("span");
      left.id="fourfu-festival-diya-left";left.className="fu-diya";left.textContent="🪔";right.id="fourfu-festival-diya-right";right.className="fu-diya fu-diya-right";right.textContent="🪔";
      left.setAttribute("aria-hidden","true");right.setAttribute("aria-hidden","true");document.body.append(left,right);addRangoli();
    }
    if(key==="eid"&&!reducedMotion){const moon=document.createElement("span");moon.id="fourfu-festival-moon";moon.className="fu-diya";moon.textContent="☾";moon.setAttribute("aria-hidden","true");document.body.appendChild(moon);}
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
    if(!liveConfig)return;
    if(boundaryTimer!==null)window.clearTimeout(boundaryTimer);boundaryTimer=null;
    const now=Date.now(),nextKey=activeForDate(liveConfig,now);
    if(nextKey)build(nextKey);else if(activeKey)removeExperience();
    if(liveConfig.enabled===true&&liveConfig.mode==="scheduled"&&valid(liveConfig.festival)){
      const start=Date.parse(liveConfig.startAt||""),end=Date.parse(liveConfig.endAt||"");
      if(Number.isFinite(start)&&Number.isFinite(end)&&end>start){const boundary=now<start?start:(now<end?end:null);if(boundary!==null)boundaryTimer=window.setTimeout(applyLiveConfig,Math.min(MAX_TIMER,Math.max(0,boundary-now+20)));}
    }
  }
  function start(){
    if(params.has("festivalPreview")){if(valid(preview))build(preview,true);return;}
    if(typeof db==="undefined"||!db.collection)return;
    db.collection("settings").doc("website").get().then(doc=>{if(!doc.exists)return;liveConfig=doc.data().festival||null;applyLiveConfig();}).catch(err=>console.warn("[4FU Festive Universe] Could not load festival settings:",err));
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")applyLiveConfig();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
