/* 4FU FESTIVAL LOADER ART DIRECTION — runs alongside the scheduler, never changes app data */
(() => {
  "use strict";
  const themes = {
    diwali:["LIGHT UP THE LEGEND","A night of light. A spirit of victory."],
    holi:["COLOUR THE BATTLE","A brighter season. A bolder 4FU."],
    eid:["UNITED IN EVERY MOMENT","Peace, gratitude and togetherness."],
    christmas:["THE SEASON OF VICTORY","Warm wishes from the 4FU family."],
    newyear:["NEXT LEVEL. NEW YEAR.","New goals. New victories. One team."],
    independence:["THE SPIRIT OF FREEDOM","Honouring courage, pride and unity."],
    halloween:["ENTER THE 4FU NIGHT","A little mystery. A lot of mayhem."]
  };
  const apply=()=>{
    const html=document.documentElement;
    const key=Object.keys(themes).find(k=>html.classList.contains("fu-festival-"+k));
    if(!key)return;
    const loader=document.getElementById("loader");
    if(loader){
      loader.classList.add("fu-themed-loader");
      const content=loader.querySelector(".loader-content");
      if(content){
        let badge=content.querySelector(".fu-loader-edition");
        if(!badge){badge=document.createElement("span");badge.className="fu-loader-edition";content.insertBefore(badge,content.querySelector("h1"));}
        badge.textContent=themes[key][0];
        const tagline=content.querySelector("p");if(tagline)tagline.textContent=themes[key][1];
      }
    }
    document.body.classList.add("fu-festival-active");
  };
  const css=document.createElement("style");
  css.textContent='.fu-loader-edition{display:block;margin:0 auto 10px;color:var(--fu-accent);font:700 10px/1.4 Poppins,sans-serif;letter-spacing:.32em;text-transform:uppercase;text-shadow:0 0 18px var(--fu-wash)}html[class*="fu-festival-"] .loader-content p{letter-spacing:2px!important;font-size:11px!important}';
  document.head.appendChild(css);
  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();
