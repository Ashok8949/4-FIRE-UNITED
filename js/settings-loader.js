// ===============================
// WEBSITE SETTINGS LOADER
// ===============================

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
    if(loaderNode){if(loaderConfig.enabled===false)loaderNode.remove();else{const safeColor=hex(loaderConfig.background);if(safeColor)loaderNode.style.setProperty("--4fu-loader-bg",safeColor);const title=loaderNode.querySelector(".loader-content h1"),sub=loaderNode.querySelector(".loader-content p"),logo=loaderNode.querySelector(".loader-logo");if(title&&typeof loaderConfig.title==="string"&&loaderConfig.title.trim())title.textContent=loaderConfig.title.slice(0,50);if(sub&&typeof loaderConfig.subtitle==="string")sub.textContent=loaderConfig.subtitle.slice(0,90);if(logo&&typeof loaderConfig.logo==="string"&&loaderConfig.logo.trim()){try{const u=new URL(loaderConfig.logo,window.location.origin);if(u.protocol==="https:"||u.origin===window.location.origin)logo.src=u.href}catch(_){}}if(["bullet","minimal","glow"].includes(loaderConfig.preset))loaderNode.setAttribute("data-4fu-loader",loaderConfig.preset)}}

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
    const textContentMap={eyebrow:"eyebrow",title:"title",highlight:"highlight",subtitle:"subtitle",description:"description",primaryText:"primaryText",secondaryText:"secondaryText"};
    Object.entries(textContentMap).forEach(([key,field])=>{const value=content[key];if(typeof value==="string"&&value.trim()){document.querySelectorAll('[data-4fu-content="'+field+'"]').forEach(node=>{node.textContent=value.slice(0,320)})}});
    const safeLink=value=>{if(typeof value!=="string"||!value.trim())return"";try{const u=new URL(value,window.location.origin);return(u.protocol==="https:"||u.origin===window.location.origin)?u.href:""}catch(_){return""}};
    [["primaryLink","primaryLink"],["secondaryLink","secondaryLink"]].forEach(([field,key])=>{const url=safeLink(content[key]);if(url)document.querySelectorAll('[data-4fu-content-link="'+field+'"]').forEach(node=>{node.href=url})});
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

.catch((err) => {

    console.error("Settings Loader Error:", err);

});
/* P5: controlled ambient motion; never overrides OS reduced-motion preference. */
(()=>{const s=window.__4FU_SETTINGS__||null;})();
