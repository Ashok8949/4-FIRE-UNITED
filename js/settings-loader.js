// ===============================
// WEBSITE SETTINGS LOADER
// ===============================

db.collection("settings")
.doc("website")
.get()

.then((doc) => {

    if (!doc.exists) return;

    const s = doc.data();

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