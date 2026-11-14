// ===============================
// WEBSITE SETTINGS LOADER
// ===============================
// ===============================
// PRIVATE EXPERIENCE STUDIO LIVE PREVIEW
// ===============================
(()=>{
 const params=new URLSearchParams(location.search);
 if(params.get("studioPreview")!=="1"||window.parent===window)return;
 const allowedOrigin=location.origin;
 const safeHex=v=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v)?v:"";
 const safeUrl=v=>{if(typeof v!=="string"||!v.trim())return"";try{const u=new URL(v,location.origin);return u.protocol==="https:"||u.origin===location.origin?u.href:""}catch(_){return""}};
 function apply(p){
  if(!p||p.type!=="4FU_STUDIO_PREVIEW")return;
  const d=p.design||{},b=p.brand||{},c=p.content||{},root=document.documentElement;
  [["--4fu-accent",d.accent],["--4fu-secondary",d.secondary],["--4fu-page-bg",d.background],["--4fu-surface",d.surface],["--4fu-text",d.text]].forEach(([k,v])=>{const x=safeHex(v);if(x)root.style.setProperty(k,x)});
  const enums={headerStyle:["glass","solid","minimal"],footerStyle:["surface","minimal","gradient"],cardStyle:["elevated","glass","flat","outlined"],buttonStyle:["solid","gradient","outline","glass"],fontFamily:["modern","classic","editorial"],shadowStyle:["soft","strong","none"],borderStyle:["subtle","defined","none"],motionLevel:["reduced","balanced","expressive"]};
  Object.entries(enums).forEach(([k,a])=>{if(a.includes(d[k]))root.setAttribute("data-4fu"+k.toLowerCase(),d[k])});
  root.style.setProperty("--4fu-radius",d.radius==="sharp"?"5px":d.radius==="round"?"22px":"10px");
  root.style.setProperty("--4fu-content-width",d.contentWidth==="compact"?"1120px":d.contentWidth==="wide"?"1440px":"1280px");
  root.style.setProperty("--4fu-section-gap",d.sectionSpacing==="compact"?"32px":d.sectionSpacing==="spacious"?"88px":"56px");
  const textMap={eyebrow:"eyebrow",title:"title",highlight:"highlight",subtitle:"subtitle",description:"description",primaryText:"primaryText",secondaryText:"secondaryText",aboutEyebrow:"aboutEyebrow",aboutTitle:"aboutTitle",aboutDescription:"aboutDescription",aboutButtonText:"aboutButtonText"};
  Object.entries(textMap).forEach(([k,v])=>{if(typeof c[k]==="string"&&c[k].trim())document.querySelectorAll('[data-4fu-content="'+v+'"]').forEach(n=>n.textContent=c[k].slice(0,500))});
  [["primaryLink","primaryLink"],["secondaryLink","secondaryLink"],["aboutButtonLink","aboutButtonLink"]].forEach(([k,v])=>{const u=safeUrl(c[k]);if(u)document.querySelectorAll('[data-4fu-content-link="'+v+'"]').forEach(n=>n.href=u)});
  const bg=safeUrl(c.heroBackground);if(bg){const hero=document.querySelector(".hero");if(hero)hero.style.backgroundImage='linear-gradient(90deg,rgba(5,8,14,.82),rgba(5,8,14,.3)),url("'+bg.replace(/["\\]/g,"")+'")'}
  const name=(b.name||"4 FIRE UNITED").trim(),short=(b.shortName||"4FU").trim();
  document.querySelectorAll(".team-name").forEach(n=>n.textContent=name);document.querySelectorAll(".team-short-name").forEach(n=>n.textContent=short);document.querySelectorAll(".brand-tagline").forEach(n=>n.textContent=b.tagline||"");
  if(b.title)document.title=b.title;
  const logo=safeUrl(b.logo),compact=safeUrl(b.compactLogo)||logo;
  document.querySelectorAll(".logo img").forEach(img=>{const chosen=img.closest(".compact-brand,.mobile-brand")?compact:logo;if(chosen)img.src=chosen;img.alt=name});
  const hero=document.querySelector(".hero");if(hero){const bg=safeUrl(c.heroBackground);hero.style.backgroundImage=bg?'linear-gradient(90deg,rgba(5,8,14,.82),rgba(5,8,14,.3)),url("'+bg.replace(/["\\\\]/g,"")+'")':""}
  const previewBrandName=(b.name||"4 FIRE UNITED").trim(),socialTitle=b.title||previewBrandName;if(socialTitle)document.title=socialTitle;
  const favicon=safeUrl(b.favicon);if(favicon){let icon=document.querySelector('link[rel~="icon"]');if(!icon){icon=document.createElement("link");icon.rel="icon";document.head.appendChild(icon)}icon.href=favicon}
  const previewLogo=safeUrl(b.logo),previewCompact=safeUrl(b.compactLogo)||previewLogo;document.querySelectorAll(".logo img").forEach(img=>{const chosen=img.closest(".compact-brand,.mobile-brand")?previewCompact:previewLogo;if(chosen)img.src=chosen;img.alt=previewBrandName});
  const previewLoader=document.getElementById("loader"),previewLoaderConfig=p.loader||{};if(previewLoader){if(previewLoaderConfig.enabled===false)previewLoader.remove();else{const h=previewLoader.querySelector(".loader-content h1"),sub=previewLoader.querySelector(".loader-content p"),img=previewLoader.querySelector(".loader-logo");if(h&&typeof previewLoaderConfig.title==="string")h.textContent=previewLoaderConfig.title;if(sub&&typeof previewLoaderConfig.subtitle==="string")sub.textContent=previewLoaderConfig.subtitle;if(img&&safeUrl(previewLoaderConfig.logo))img.src=safeUrl(previewLoaderConfig.logo);if(safeHex(previewLoaderConfig.background))previewLoader.style.backgroundColor=previewLoaderConfig.background;if(Number.isFinite(Number(previewLoaderConfig.duration)))previewLoader.dataset.minDuration=String(Math.max(1800,Math.min(8000,Number(previewLoaderConfig.duration))));if(["bullet","minimal","glow"].includes(previewLoaderConfig.preset)){previewLoader.dataset["4fuLoader"]=previewLoaderConfig.preset;if(!document.getElementById("4fu-preview-loader-style")){const st=document.createElement("style");st.id="4fu-preview-loader-style";st.textContent='#loader[data-4fu-loader="minimal"] .bullet,#loader[data-4fu-loader="minimal"] .explosion{display:none!important}#loader[data-4fu-loader="glow"] .bullet{filter:drop-shadow(0 0 16px #ffb35c)}#loader[data-4fu-loader="glow"] .loader-content{filter:drop-shadow(0 0 28px #ff9d4a)}';document.head.appendChild(st)}}}}
  if(!document.getElementById("4fu-studio-design-preview-style")){const st=document.createElement("style");st.id="4fu-studio-design-preview-style";st.textContent='.hero-container,.about-container,.players-container,.stats-container,.hall-container,.home-clips-grid,.gallery-grid,.featured-tournament{max-width:var(--4fu-content-width,1280px)}.hero,.about,.players,.latest-news,.home-clips,.featured-tournament,.hall,.gallery-preview,.stats-section,.join-team{padding-block:var(--4fu-section-gap,56px)}.hero-buttons .btn1,.hero-buttons .btn2,.navbar .join-btn,.gallery-btn .btn1,.join-team .btn1{border-radius:var(--4fu-radius,10px);transition:filter .2s,transform .2s}.hero-buttons .btn1,.navbar .join-btn,.gallery-btn .btn1,.join-team .btn1{background:var(--4fu-accent,#ff7417);border-color:var(--4fu-accent,#ff7417)}.hero-buttons .btn2{border-color:var(--4fu-secondary,#ffc15a)}.stat-box,.about-card,.hall-card,.stats-card{border-radius:var(--4fu-radius,10px);background-color:var(--4fu-surface,#151923)}.navbar .nav-links a:hover,.footer-links a:hover{color:var(--4fu-accent,#ff7417)}';document.head.appendChild(st)}
  const motion=p.animation||{};document.getElementById("4fu-ambient-motion")?.remove();
  if(motion.enabled===true&&motion.effect&&motion.effect!=="none"&&!matchMedia("(prefers-reduced-motion: reduce)").matches){const layer=document.createElement("div");layer.id="4fu-ambient-motion";layer.className="fu-ambient fu-ambient-"+motion.effect;layer.setAttribute("aria-hidden","true");const count=motion.intensity==="high"?22:motion.intensity==="medium"?14:8;for(let i=0;i<count;i++){const dot=document.createElement("i");dot.style.setProperty("--x",Math.random()*100+"vw");dot.style.setProperty("--delay",-Math.random()*16+"s");dot.style.setProperty("--duration",(motion.speed==="fast"?9:motion.speed==="slow"?22:14)+"s");layer.append(dot)}document.body.append(layer)}
  const loader=document.getElementById("loader"),l=p.loader||{};if(loader){if(l.enabled===false)loader.remove();else{const h=loader.querySelector(".loader-content h1"),sub=loader.querySelector(".loader-content p");if(h&&l.title)h.textContent=l.title;if(sub&&typeof l.subtitle==="string")sub.textContent=l.subtitle;if(safeHex(l.background))loader.style.setProperty("--4fu-loader-bg",l.background);if(["bullet","minimal","glow"].includes(l.preset))loader.dataset["4fuLoader"]=l.preset}}
  window.dispatchEvent(new CustomEvent("4fu:studio-preview",{detail:{festivalLibrary:p.festivalLibrary||[],selectedFestival:p.selectedFestival}}));
 }
 window.__4FU_STUDIO_PREVIEW_APPLY__=apply;
 window.addEventListener("message",e=>{if(e.origin!==allowedOrigin||e.source!==window.parent)return;window.__4FU_STUDIO_PREVIEW_LAST__=e.data;apply(e.data)});
})();

db.collection("settings")
.doc("website")
.get()

.then((doc) => {

    if (!doc.exists) return;


    const s = doc.data();
    const brand = s.experience && s.experience.brand ? s.experience.brand : {};
    const design = s.experience && s.experience.design ? s.experience.design : {};
    const root=document.documentElement;
    const hex=v=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v)?v:"";
    [["--4fu-accent",design.accent],["--4fu-secondary",design.secondary],["--4fu-page-bg",design.background],["--4fu-surface",design.surface],["--4fu-text",design.text]].forEach(([k,v])=>{const safe=hex(v);if(safe)root.style.setProperty(k,safe)});
    const enums={headerStyle:["glass","solid","minimal"],footerStyle:["surface","minimal","gradient"],cardStyle:["elevated","glass","flat","outlined"],buttonStyle:["solid","gradient","outline","glass"],fontFamily:["modern","classic","editorial"],shadowStyle:["soft","strong","none"],borderStyle:["subtle","defined","none"],motionLevel:["reduced","balanced","expressive"]};
    Object.entries(enums).forEach(([k,allowed])=>{const v=allowed.includes(design[k])?design[k]:"";if(v)root.setAttribute("data-4fu"+k.toLowerCase(),v)});
    root.style.setProperty("--4fu-radius",design.radius==="sharp"?"5px":design.radius==="round"?"22px":"10px");
    root.style.setProperty("--4fu-content-width",design.contentWidth==="compact"?"1120px":design.contentWidth==="wide"?"1440px":"1280px");
    root.style.setProperty("--4fu-section-gap",design.sectionSpacing==="compact"?"32px":design.sectionSpacing==="spacious"?"88px":"56px");
    if(!document.getElementById("4fu-design-system")){const style=document.createElement("style");style.id="4fu-design-system";style.textContent=":root{--4fu-accent:#ff7417;--4fu-secondary:#ffc15a;--4fu-page-bg:#090b12;--4fu-surface:#151923;--4fu-text:#f5f7fb}\nbody{background-color:var(--4fu-page-bg);color:var(--4fu-text)}\n.navbar,header.navbar{border-radius:var(--4fu-radius,10px)}\n.card,.feature-card,.tournament-card,.gallery-item,.profile-card,.dashboard-card{border-radius:var(--4fu-radius,10px)}\n[data-4fuheaderstyle=\"glass\"] .navbar{backdrop-filter:blur(18px);background:color-mix(in srgb,var(--4fu-surface) 82%,transparent)}\n[data-4fuheaderstyle=\"solid\"] .navbar{background:var(--4fu-surface)}\n[data-4fuheaderstyle=\"minimal\"] .navbar{background:transparent;box-shadow:none}\n[data-4fucardstyle=\"glass\"] .card,[data-4fucardstyle=\"glass\"] .feature-card,[data-4fucardstyle=\"glass\"] .tournament-card{background:color-mix(in srgb,var(--4fu-surface) 78%,transparent);backdrop-filter:blur(16px)}\n[data-4fucardstyle=\"flat\"] .card,[data-4fucardstyle=\"flat\"] .feature-card{box-shadow:none}\n[data-4fucardstyle=\"outlined\"] .card,[data-4fucardstyle=\"outlined\"] .feature-card{background:transparent;border:1px solid color-mix(in srgb,var(--4fu-text) 22%,transparent);box-shadow:none}\n[data-4fubuttonstyle=\"gradient\"] button.primary,[data-4fubuttonstyle=\"gradient\"] .btn-primary{background:linear-gradient(120deg,var(--4fu-accent),var(--4fu-secondary))}\n[data-4fubuttonstyle=\"outline\"] button,[data-4fubuttonstyle=\"outline\"] .btn{background:transparent;border:1px solid var(--4fu-accent);color:var(--4fu-text)}\n[data-4fubuttonstyle=\"glass\"] button,[data-4fubuttonstyle=\"glass\"] .btn{background:color-mix(in srgb,var(--4fu-surface) 75%,transparent);border:1px solid color-mix(in srgb,var(--4fu-accent) 50%,transparent);backdrop-filter:blur(12px)}\n[data-4fufontfamily=\"classic\"] body{font-family:\"DM Sans\",sans-serif}\n[data-4fufontfamily=\"modern\"] body{font-family:\"Space Grotesk\",\"DM Sans\",sans-serif}\n[data-4fufontfamily=\"editorial\"] h1,[data-4fufontfamily=\"editorial\"] h2{font-family:Georgia,serif}\n[data-4fushadowstyle=\"none\"] .card,[data-4fushadowstyle=\"none\"] .feature-card{box-shadow:none}\n[data-4fushadowstyle=\"strong\"] .card,[data-4fushadowstyle=\"strong\"] .feature-card{box-shadow:0 18px 50px rgba(0,0,0,.28)}\n[data-4fuborderstyle=\"none\"] .card,[data-4fuborderstyle=\"none\"] .feature-card{border-color:transparent}\n[data-4fuborderstyle=\"defined\"] .card,[data-4fuborderstyle=\"defined\"] .feature-card{border-color:color-mix(in srgb,var(--4fu-text) 24%,transparent)}";style.textContent+="\n[data-4fufooterstyle=\"minimal\"] footer,[data-4fufooterstyle=\"minimal\"] .footer{background:transparent;box-shadow:none;border-top-color:transparent}\n[data-4fufooterstyle=\"gradient\"] footer,[data-4fufooterstyle=\"gradient\"] .footer{background:linear-gradient(135deg,var(--4fu-surface),color-mix(in srgb,var(--4fu-accent) 16%,var(--4fu-surface)))}\n[data-4fufooterstyle=\"surface\"] footer,[data-4fufooterstyle=\"surface\"] .footer{background:var(--4fu-surface)}\n.container,.page-container,.main-content{max-width:var(--4fu-content-width,1280px)}\n@media(prefers-reduced-motion:reduce){[data-4fumotionlevel=\"expressive\"] *{animation:none!important;transition:none!important}}";document.head.appendChild(style)}
    document.querySelectorAll(".container,.page-container,.main-content").forEach(n=>{n.style.maxWidth="var(--4fu-content-width)"});


    // P5 motion and loader presentation settings (strict allowlists; no injected markup).
    const experience=s.experience||{}, animation=experience.animation||{}, loaderConfig=experience.loader||{};
    const motionEffects=["none","sparkle","snow","confetti","fireflies","petals"];
    const motionRoot=document.documentElement;
    if(animation.enabled===true&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      const effect=motionEffects.includes(animation.effect)?animation.effect:"none";
      const mobile=window.matchMedia("(max-width: 700px)").matches;
      const density=animation.intensity==="high"?(mobile?8:22):animation.intensity==="medium"?(mobile?5:14):(mobile?3:8);
      if(effect!=="none"&&!document.getElementById("4fu-ambient-motion")){if(!document.getElementById("4fu-ambient-style")){const st=document.createElement("style");st.id="4fu-ambient-style";st.textContent=".fu-ambient{position:fixed;inset:0;z-index:9998;pointer-events:none;overflow:hidden}.fu-ambient i{position:absolute;left:var(--x);top:-8vh;width:4px;height:4px;border-radius:50%;opacity:var(--alpha);animation:fuAmbientFall var(--duration) linear var(--delay) infinite}.fu-ambient-sparkle i,.fu-ambient-fireflies i{background:#ffd68a;box-shadow:0 0 12px #ffb84d}.fu-ambient-snow i{background:#fff;width:5px;height:5px}.fu-ambient-confetti i{background:#ff8b37;border-radius:1px}.fu-ambient-petals i{background:#ff8db6;width:8px;height:5px;border-radius:80% 10% 80% 10%}@keyframes fuAmbientFall{to{transform:translate3d(8vw,115vh,0) rotate(540deg)}}@media(prefers-reduced-motion:reduce){.fu-ambient{display:none!important}}";document.head.appendChild(st)}const layer=document.createElement("div");layer.id="4fu-ambient-motion";layer.className="fu-ambient fu-ambient-"+effect;layer.setAttribute("aria-hidden","true");for(let i=0;i<density;i++){const p=document.createElement("i");p.style.setProperty("--x",(Math.random()*100)+"vw");p.style.setProperty("--delay",(-Math.random()*18)+"s");p.style.setProperty("--duration",((animation.speed==="fast"?8:animation.speed==="slow"?22:14)+Math.random()*7)+"s");p.style.setProperty("--alpha",String(Math.max(.1,Math.min(.7,Number(animation.opacity||35)/100))));layer.appendChild(p)}document.body.appendChild(layer)}
    }
    const loaderNode=document.getElementById("loader");
    if(loaderNode){if(loaderConfig.enabled===false)loaderNode.remove();else{const safeColor=hex(loaderConfig.background);if(safeColor)loaderNode.style.setProperty("--4fu-loader-bg",safeColor);const title=loaderNode.querySelector(".loader-content h1"),sub=loaderNode.querySelector(".loader-content p"),logo=loaderNode.querySelector(".loader-logo");if(title&&typeof loaderConfig.title==="string"&&loaderConfig.title.trim())title.textContent=loaderConfig.title.slice(0,50);if(sub&&typeof loaderConfig.subtitle==="string")sub.textContent=loaderConfig.subtitle.slice(0,90);if(logo&&typeof loaderConfig.logo==="string"&&loaderConfig.logo.trim()){try{const u=new URL(loaderConfig.logo,window.location.origin);if(u.protocol==="https:"||u.origin===window.location.origin)logo.src=u.href}catch(_){}}if(["bullet","minimal","glow"].includes(loaderConfig.preset))loaderNode.setAttribute("data-4fu-loader",loaderConfig.preset);const duration=Number(loaderConfig.duration);loaderNode.dataset.minDuration=String(Number.isFinite(duration)?Math.max(1800,Math.min(8000,duration)):4600)}}

    // Centralized public brand identity. Text is assigned via textContent;
    // admin-provided values are never interpreted as markup or executable code.
    const safeAsset = (value) => {
        if (typeof value !== "string" || !value.trim()) return "";
        try {
            const url = new URL(value.trim(), window.location.origin);
            return (url.protocol === "https:" || url.origin === window.location.origin) ? url.href : "";
        } catch (_) { return ""; }
    };
    // P6: allowlisted homepage hero copy and media. Only explicitly tagged nodes are updated.
    const content=experience.content||{};
    const textContentMap={eyebrow:"eyebrow",title:"title",highlight:"highlight",subtitle:"subtitle",description:"description",primaryText:"primaryText",secondaryText:"secondaryText",aboutEyebrow:"aboutEyebrow",aboutTitle:"aboutTitle",aboutDescription:"aboutDescription",aboutButtonText:"aboutButtonText"};
    Object.entries(textContentMap).forEach(([key,field])=>{const value=content[key];if(typeof value==="string"&&value.trim()){document.querySelectorAll('[data-4fu-content="'+field+'"]').forEach(node=>{node.textContent=value.slice(0,320)})}});
    const safeLink=value=>{if(typeof value!=="string"||!value.trim())return"";try{const u=new URL(value,window.location.origin);return(u.protocol==="https:"||u.origin===window.location.origin)?u.href:""}catch(_){return""}};
    [["primaryLink","primaryLink"],["secondaryLink","secondaryLink"],["aboutButtonLink","aboutButtonLink"]].forEach(([field,key])=>{const url=safeLink(content[key]);if(url)document.querySelectorAll('[data-4fu-content-link="'+field+'"]').forEach(node=>{node.href=url})});
    const heroBackground=safeAsset(content.heroBackground);
    if(heroBackground){const hero=document.querySelector(".hero");if(hero)hero.style.backgroundImage='linear-gradient(90deg,rgba(5,8,14,.82),rgba(5,8,14,.3)),url("'+heroBackground.replace(/["\\]/g,"")+'")';}
    const brandName = (brand.name || s.teamName || "4 FIRE UNITED").trim();
    const brandShortName = (brand.shortName || "4FU").trim();
    document.querySelectorAll(".team-name").forEach((node) => { node.textContent = brandName; });
    document.querySelectorAll(".team-short-name").forEach((node) => { node.textContent = brandShortName; });
    document.querySelectorAll(".brand-tagline").forEach((node) => { node.textContent = brand.tagline || ""; });

    if (brand.title) document.title = brand.title;
    const setMeta = (selector, attr, value, content) => {
        if (!content) return;
        let node = document.head.querySelector(selector);
        if (!node) {
            node = document.createElement("meta");
            node.setAttribute(attr, value);
            document.head.appendChild(node);
        }
        node.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', "name", "description", brand.description);
    setMeta('meta[property="og:title"]', "property", "og:title", brand.title || brandName);
    setMeta('meta[property="og:description"]', "property", "og:description", brand.description);
    const socialImage = safeAsset(brand.ogImage);
    if (socialImage) setMeta('meta[property="og:image"]', "property", "og:image", socialImage);
    const favicon = safeAsset(brand.favicon);
    if (favicon) {
        let icon = document.querySelector('link[rel~="icon"]');
        if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); }
        icon.href = favicon;
    }
    const primaryLogo = safeAsset(brand.logo) || safeAsset(s.logo);
    const compactLogo = safeAsset(brand.compactLogo) || primaryLogo;
    document.querySelectorAll(".logo img").forEach((img) => {
        const compact = img.closest(".compact-brand, .mobile-brand");
        const selected = compact ? compactLogo : primaryLogo;
        if (selected) img.src = selected;
        img.alt = brandName;
    });


    // ==========================
    // Team Name
    // ==========================

    document.querySelectorAll(".team-name").forEach((e) => {

        e.textContent = brandName;

    });

    // ==========================
    // Hero Title
    // ==========================

    const heroTitle = document.getElementById("heroTitle");

    if (heroTitle) {

        heroTitle.textContent = s.heroTitle || "";

    }

    // ==========================
    // Hero Subtitle
    // ==========================

    const heroSubtitle = document.getElementById("heroSubtitle");

    if (heroSubtitle) {

        heroSubtitle.textContent = s.heroSubtitle || "";

    }

    // ==========================
    // Email
    // ==========================

    const email = document.getElementById("contactEmail");

    if (email) {

        email.textContent = s.email || "";

    }

    // ==========================
    // Phone
    // ==========================

    const phone = document.getElementById("contactPhone");

    if (phone) {

        phone.textContent = s.phone || "";

    }

    // ==========================
    // Address
    // ==========================

    const address = document.getElementById("contactAddress");

    if (address) {

        address.textContent = s.address || "";

    }

    // ==========================
    // Social Links
    // ==========================

    const socialLinks = [

        {
            id: "instagramLink",
            url: s.instagram
        },

        {
            id: "youtubeLink",
            url: s.youtube
        },

        {
            id: "discordLink",
            url: s.discord
        },

        {
            id: "facebookLink",
            url: s.facebook
        }

    ];

    socialLinks.forEach((social) => {

        const link = document.getElementById(social.id);

        if (!link) return;

        if (social.url && social.url.trim() !== "") {

            link.href = social.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

        } else {

            link.removeAttribute("href");
            link.style.opacity = "0.5";
            link.style.pointerEvents = "none";

        }

    });

})
.then(() => { if(window.__4FU_STUDIO_PREVIEW_LAST__&&window.__4FU_STUDIO_PREVIEW_APPLY__)window.__4FU_STUDIO_PREVIEW_APPLY__(window.__4FU_STUDIO_PREVIEW_LAST__); })
.catch((err) => {

    console.error("Settings Loader Error:", err);

});
/* P5: controlled ambient motion; never overrides OS reduced-motion preference. */
(()=>{const s=window.__4FU_SETTINGS__||null;})();
