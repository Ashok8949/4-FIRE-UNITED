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

        e.textContent = s.teamName || "4 FIRE UNITED";

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
    // Logo
    // ==========================

    document.querySelectorAll(".logo img").forEach((img) => {

        if (s.logo) {

            img.src = s.logo;

        }

    });

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