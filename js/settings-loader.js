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


    // Centralized public brand identity. Text is assigned via textContent;
    // admin-provided values are never interpreted as markup or executable code.
    const safeAsset = (value) => {
        if (typeof value !== "string" || !value.trim()) return "";
        try {
            const url = new URL(value.trim(), window.location.origin);
            return (url.protocol === "https:" || url.origin === window.location.origin) ? url.href : "";
        } catch (_) { return ""; }
    };
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