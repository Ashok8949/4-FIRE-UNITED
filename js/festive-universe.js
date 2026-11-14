/* 4FU FESTIVE UNIVERSE
 * Reads the public settings/website.festival document fields.
 * No external animation libraries; bounded DOM particles and reduced-motion support.
 */
(() => {
  "use strict";
  const FESTIVALS = {
    diwali:{label:"Happy Diwali",emoji:"🪔",particle:"fu-spark",count:24,message:"May your days shine bright — Happy Diwali!"},
    holi:{label:"Happy Holi",emoji:"🎨",particle:"fu-holi-splash",count:13,message:"Add a little colour to every victory — Happy Holi!"},
    christmas:{label:"Merry Christmas",emoji:"🎄",particle:"fu-snow",count:30,message:"Wishing the 4FU family a magical Christmas!"},
    newyear:{label:"Happy New Year",emoji:"🎆",particle:"fu-confetti",count:34,message:"New year. New goals. Same 4FU fire!"},
    eid:{label:"Eid Mubarak",emoji:"🌙",particle:"fu-spark",count:18,message:"Peace, happiness and victories — Eid Mubarak!"},
    independence:{label:"Happy Independence Day",emoji:"🇮🇳",particle:"fu-confetti",count:22,message:"Celebrating freedom, courage and unity."},
    halloween:{label:"Happy Halloween",emoji:"🎃",particle:"fu-spark",count:18,message:"A little spooky, a lot competitive. Happy Halloween!"}
  };
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(location.search);
  const preview = params.get("festivalPreview");
  const valid = key => Object.prototype.hasOwnProperty.call(FESTIVALS,key);
  const activeForDate = cfg => {
    if (!cfg || cfg.enabled !== true || !valid(cfg.festival)) return null;
    if (cfg.mode === "scheduled") {
      const now = Date.now(), start = Date.parse(cfg.startAt || ""), end = Date.parse(cfg.endAt || "");
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || now < start || now > end) return null;
    }
    return cfg.festival;
  };
  function addRangoli(root){
    const wrap=document.createElement("div"); wrap.className="fu-rangoli"; wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="#ffbd4a" stroke-width="1.5"><circle cx="100" cy="100" r="82"/><circle cx="100" cy="100" r="65"/><circle cx="100" cy="100" r="46"/><circle cx="100" cy="100" r="24"/><path d="M100 18V182M18 100H182M42 42L158 158M158 42L42 158"/><path d="M100 22Q128 52 100 78Q72 52 100 22ZM178 100Q148 128 122 100Q148 72 178 100ZM100 178Q72 148 100 122Q128 148 100 178ZM22 100Q52 72 78 100Q52 128 22 100Z"/></g><g fill="#ffdf80"><circle cx="100" cy="18" r="3"/><circle cx="182" cy="100" r="3"/><circle cx="100" cy="182" r="3"/><circle cx="18" cy="100" r="3"/></g></svg>';
    root.appendChild(wrap);
  }
  function build(key){
    const theme=FESTIVALS[key]; if(!theme)return;
    document.documentElement.classList.add("fu-festival-"+key);
    const layer=document.createElement("div"); layer.id="fourfu-festival-layer"; layer.setAttribute("aria-hidden","true");
    if(!reduced){
      for(let i=0;i<theme.count;i++){
        const p=document.createElement("span"); p.className="fu-festival-particle "+theme.particle;
        p.style.setProperty("--x",Math.random()*100+"vw");
        p.style.setProperty("--duration",(9+Math.random()*13)+"s");
        p.style.setProperty("--delay",(-Math.random()*18)+"s");
        p.style.setProperty("--drift",(-65+Math.random()*130)+"px");
        p.style.setProperty("--alpha",(.25+Math.random()*.45).toFixed(2));
        p.style.setProperty("--rot",Math.round(Math.random()*180)+"deg");
        if(key==="holi")p.style.background=["#ff4e9b","#ffc247","#38d8c5","#8c75ff","#ff794d"][i%5];
        if(key==="newyear"||key==="independence")p.style.background=key==="independence"?["#ff9933","#fff","#138808"][i%3]:["#ffca55","#8fd7ff","#ff7eb6","#b49aff"][i%4];
        layer.appendChild(p);
      }
    }
    document.body.appendChild(layer);
    if(key==="diwali"){
      const left=document.createElement("span"),right=document.createElement("span");
      left.className="fu-diya";right.className="fu-diya fu-diya-right";left.textContent="🪔";right.textContent="🪔";
      left.setAttribute("aria-hidden","true");right.setAttribute("aria-hidden","true");document.body.append(left,right);addRangoli(document.body);
    }
    if(key==="eid"&&!reduced){const moon=document.createElement("span");moon.className="fu-diya";moon.textContent="🌙";moon.setAttribute("aria-hidden","true");document.body.appendChild(moon);}
    if(!sessionStorage.getItem("fu-festival-welcomed")){
      const toast=document.createElement("div");toast.className="fu-festival-toast";toast.setAttribute("role","status");toast.textContent=theme.emoji+" "+theme.message;document.body.appendChild(toast);
      sessionStorage.setItem("fu-festival-welcomed","1");setTimeout(()=>toast.remove(),6500);
    }
  }
  function start(){
    if(preview && valid(preview)){build(preview);return;}
    if(!window.db || !window.db.collection)return;
    window.db.collection("settings").doc("website").get().then(doc=>{
      if(!doc.exists)return;
      const key=activeForDate(doc.data().festival);
      if(key)build(key);
    }).catch(err=>console.warn("[4FU Festive Universe] Could not load festival settings:",err));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
