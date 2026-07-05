const settingsRef = db.collection("settings").doc("website");

// ==============================
// Load Settings
// ==============================

settingsRef.get().then((doc) => {

    if (doc.exists) {

        const s = doc.data();

        document.getElementById("teamName").value = s.teamName || "";
        document.getElementById("email").value = s.email || "";
        document.getElementById("phone").value = s.phone || "";
        document.getElementById("address").value = s.address || "";
        document.getElementById("logo").value = s.logo || "";
        document.getElementById("instagram").value = s.instagram || "";
        document.getElementById("youtube").value = s.youtube || "";
        document.getElementById("discord").value = s.discord || "";
        document.getElementById("facebook").value = s.facebook || "";

    }

}).catch((err) => {

    console.log(err);

});

// ==============================
// Save Settings
// ==============================

document.getElementById("saveSettings").addEventListener("click", () => {

    settingsRef.set({

        teamName: document.getElementById("teamName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        logo: document.getElementById("logo").value.trim(),
        instagram: document.getElementById("instagram").value.trim(),
        youtube: document.getElementById("youtube").value.trim(),
        discord: document.getElementById("discord").value.trim(),
        facebook: document.getElementById("facebook").value.trim()

    })

    .then(() => {

        alert("✅ Settings Saved Successfully!");

    })

    .catch((err) => {

        console.log(err);

        alert("❌ Failed to Save Settings!");

    });

});