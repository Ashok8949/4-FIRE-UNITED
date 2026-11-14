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
    halloween:["ENTER THE 4FU NIGHT","A little mystery. A lot of mayhem."],
    navratri:["NINE NIGHTS. ONE ENERGY.","Rhythm, devotion and radiant celebration."],
    "raksha-bandhan":["STRONGER TOGETHER","A bond that stands beyond every battle."],
    "republic-day":["ONE NATION. ONE SPIRIT.","Celebrating the strength of unity."]
  };
  const apply=()=>{
    const html=document.documentElement;
    const key=Object.keys(themes).find(k=>html.classList.contains("fu-festival-"+k));
    if(!key)return;
    const loader=document.getElementById("loader");
    if(loader){
      loader.classList.add("fu-themed-loader","fu-loader-"+key);
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
  css.textContent='.fu-loader-edition{display:block;css.textContent+="#loader.fu-themed-loader{isolation:isolate;overflow:hidden;background-color:#05070d}#loader.fu-themed-loader:before,#loader.fu-themed-loader:after{content:\"\";position:absolute;inset:0;z-index:-1;pointer-events:none}#loader.fu-loader-diwali:before{background:radial-gradient(circle at 18% 24%,#ffd77b88 0 2px,transparent 4px),radial-gradient(circle at 78% 18%,#fff1c988 0 2px,transparent 4px),radial-gradient(circle at 86% 62%,#ff9e4a88 0 2px,transparent 4px);animation:fuLoaderFireworks 2.4s ease-in-out infinite alternate}#loader.fu-loader-newyear:before{background:radial-gradient(circle at 20% 20%,#8edcff88 0 3px,transparent 5px),radial-gradient(circle at 80% 26%,#ff83b788 0 3px,transparent 5px),radial-gradient(circle at 72% 72%,#c6a3ff88 0 3px,transparent 5px);animation:fuLoaderFireworks 1.6s ease-in-out infinite alternate}#loader.fu-loader-holi:before{background:radial-gradient(ellipse at 12% 18%,#ff3b8d55,transparent 35%),radial-gradient(ellipse at 88% 20%,#24d9c455,transparent 34%),radial-gradient(ellipse at 72% 92%,#ffc24744,transparent 40%),radial-gradient(ellipse at 25% 82%,#9b70ff44,transparent 35%);filter:blur(16px);animation:fuLoaderPowder 5s ease-in-out infinite alternate}#loader.fu-loader-christmas:before{background:radial-gradient(circle at 12% 12%,#fff9 0 2px,transparent 3px),radial-gradient(circle at 82% 24%,#fff8 0 2px,transparent 3px),radial-gradient(circle at 66% 76%,#fff8 0 2px,transparent 3px),radial-gradient(ellipse at 50% 0,#54d7a333,transparent 65%);animation:fuLoaderSnow 7s linear infinite}#loader.fu-loader-eid:before{background:radial-gradient(circle at 78% 25%,#d9f7e8aa 0 36px,transparent 38px),radial-gradient(circle at 88% 20%,#071018 0 34px,transparent 36px),radial-gradient(circle at 20% 22%,#fff9 0 1px,transparent 2px);filter:drop-shadow(0 0 20px #9df5db)}#loader.fu-loader-navratri:before{background:repeating-radial-gradient(circle at 50% 110%,transparent 0 26px,#f3a4d733 27px 29px,transparent 30px 48px);animation:fuLoaderRings 8s linear infinite}#loader.fu-loader-raksha-bandhan:before{background:linear-gradient(165deg,transparent 34%,#e7a4c855 35%,#ffd9a588 36%,transparent 37%),radial-gradient(circle at 50% 50%,#e7a4c822,transparent 48%)}#loader.fu-loader-independence:before,#loader.fu-loader-republic-day:before{background:linear-gradient(165deg,transparent 20%,#ff993333 30%,transparent 40%,transparent 55%,#ffffff22 65%,transparent 72%,transparent 80%,#13880833 90%,transparent 100%)}#loader.fu-loader-halloween:before{background:radial-gradient(circle at 78% 24%,#c69aff55 0 52px,transparent 54px),radial-gradient(ellipse at 50% 100%,#8b4dff22,transparent 55%)}.fu-intro-art{position:relative;width:min(180px,42vw);aspect-ratio:1;margin:0 auto 24px;border-radius:50%;border:1px solid color-mix(in srgb,var(--fu-accent,#ffc15b) 65%,transparent);box-shadow:0 0 55px color-mix(in srgb,var(--fu-accent,#ffc15b) 28%,transparent),inset 0 0 38px color-mix(in srgb,var(--fu-accent,#ffc15b) 15%,transparent)}.fu-intro-art-holi{border:0;box-shadow:none;background:radial-gradient(circle at 20% 35%,#ff3b8d88 0 12%,transparent 35%),radial-gradient(circle at 75% 25%,#24d9c488 0 14%,transparent 36%),radial-gradient(circle at 60% 78%,#ffc24788 0 16%,transparent 38%),radial-gradient(circle at 22% 78%,#9b70ff88 0 12%,transparent 35%);filter:blur(2px)}.fu-intro-art-diwali{background:radial-gradient(circle,#fff3c7 0 3%,#ffc15b66 4% 18%,transparent 60%)}.fu-intro-art-eid{background:radial-gradient(circle at 42% 45%,#d9f7e8 0 28%,transparent 29%),radial-gradient(circle at 57% 38%,#101c27 0 28%,transparent 29%)}@keyframes fuLoaderFireworks{from{opacity:.35;transform:scale(.94)}to{opacity:1;transform:scale(1.05)}}@keyframes fuLoaderPowder{from{transform:scale(.9) rotate(-5deg)}to{transform:scale(1.12) rotate(5deg)}}@keyframes fuLoaderSnow{from{background-position:0 -20px}to{background-position:0 120px}}@keyframes fuLoaderRings{from{transform:rotate(0)}to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#loader.fu-themed-loader:before,#loader.fu-themed-loader:after{animation:none!important}}";margin:0 auto 10px;color:var(--fu-accent);font:700 10px/1.4 Poppins,sans-serif;letter-spacing:.32em;text-transform:uppercase;text-shadow:0 0 18px var(--fu-wash)}html[class*="fu-festival-"] .loader-content p{letter-spacing:2px!important;font-size:11px!important}';
  document.head.appendChild(css);
  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();
