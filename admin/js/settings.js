const settingsRef = db.collection("settings").doc("website");

// =====================================
// LOAD SETTINGS
// =====================================

settingsRef.get()

.then((doc) => {

    if (!doc.exists) return;

    const s = doc.data();

    document.getElementById("teamName").value = s.teamName || "";
    document.getElementById("email").value = s.email || "";
    document.getElementById("phone").value = s.phone || "";
    document.getElementById("address").value = s.address || "";
    document.getElementById("logo").value = s.logo || "";
    document.getElementById("heroTitle").value = s.heroTitle || "";
    document.getElementById("heroSubtitle").value = s.heroSubtitle || "";
    document.getElementById("instagram").value = s.instagram || "";
    document.getElementById("youtube").value = s.youtube || "";
    document.getElementById("discord").value = s.discord || "";
    document.getElementById("facebook").value = s.facebook || "";

})

.catch((err) => {

    console.error(err);

});

// =====================================
// SAVE SETTINGS
// =====================================

document.getElementById("saveSettings").addEventListener("click", () => {

    const btn = document.getElementById("saveSettings");

    btn.disabled = true;

    btn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    settingsRef.set({

        teamName: document.getElementById("teamName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        logo: document.getElementById("logo").value.trim(),
        heroTitle: document.getElementById("heroTitle").value.trim(),
        heroSubtitle: document.getElementById("heroSubtitle").value.trim(),
        instagram: document.getElementById("instagram").value.trim(),
        youtube: document.getElementById("youtube").value.trim(),
        discord: document.getElementById("discord").value.trim(),
        facebook: document.getElementById("facebook").value.trim()

    })

    .then(() => {

        alert("✅ Settings Saved Successfully!");

        btn.disabled = false;

        btn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Save Settings';

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Failed to Save Settings!");

        btn.disabled = false;

        btn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Save Settings';

    });

});