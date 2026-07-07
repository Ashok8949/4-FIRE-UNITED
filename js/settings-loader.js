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

        if (s.logo) img.src = s.logo;

    });

    // ==========================
    // Email
    // ==========================

    const email = document.getElementById("contactEmail");

    if (email) {

        email.textContent = s.email;

    }

    // ==========================
    // Phone
    // ==========================

    const phone = document.getElementById("contactPhone");

    if (phone) {

        phone.textContent = s.phone;

    }

    // ==========================
    // Address
    // ==========================

    const address = document.getElementById("contactAddress");

    if (address) {

        address.textContent = s.address;

    }

    // ==========================
    // Social Links
    // ==========================

    const instagram = document.getElementById("instagramLink");

    if (instagram) {

        instagram.href = s.instagram || "#";

    }

    const youtube = document.getElementById("youtubeLink");

    if (youtube) {

        youtube.href = s.youtube || "#";

    }

    const discord = document.getElementById("discordLink");

    if (discord) {

        discord.href = s.discord || "#";

    }

    const facebook = document.getElementById("facebookLink");

    if (facebook) {

        facebook.href = s.facebook || "#";

    }

})

.catch((err) => {

    console.error(err);

});