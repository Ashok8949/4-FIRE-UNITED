const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");

if (!playerId) {

    alert("Player ID Missing!");
    window.location = "players.html";

}

const docRef = db.collection("players").doc(playerId);



// ==========================================
// LOAD PLAYER
// ==========================================

docRef.get().then((doc) => {

    if (!doc.exists) {

        alert("Player Not Found!");
        window.location = "players.html";
        return;

    }

    const p = doc.data();

    document.getElementById("name").value = p.name || "";
    document.getElementById("ign").value = p.ign || "";
    document.getElementById("uid").value = p.uid || "";
    document.getElementById("role").value = p.role || "";
    document.getElementById("level").value = p.level || "";
    document.getElementById("rank").value = p.rank || "";
    document.getElementById("kd").value = p.kd || "";
    document.getElementById("headshot").value = p.headshot || "";
    document.getElementById("matches").value = p.matches || 0;
    document.getElementById("booyah").value = p.booyah || 0;
    document.getElementById("guild").value = p.guild || "";
    document.getElementById("language").value = p.language || "";

    document.getElementById("featured").checked = p.featured || false;

    // ==========================
    // Social Media
    // ==========================

    document.getElementById("instagram").value = p.instagram || "";
    document.getElementById("youtube").value = p.youtube || "";
    document.getElementById("discord").value = p.discord || "";
    document.getElementById("facebook").value = p.facebook || "";

    // Preview Image

    if (p.image) {

    previewImage.src = p.image;

    document.getElementById("image").value =
        p.image.split("/").pop();

}

})

.catch((err) => {

    console.error(err);

});

// ==========================================
// SAVE PLAYER
// ==========================================

document.getElementById("saveBtn").addEventListener("click", () => {

    const data = {

        name: document.getElementById("name").value.trim(),
        ign: document.getElementById("ign").value.trim(),
        uid: document.getElementById("uid").value.trim(),
        role: document.getElementById("role").value.trim(),
        level: Number(document.getElementById("level").value),
        rank: document.getElementById("rank").value.trim(),
        kd: document.getElementById("kd").value.trim(),
        headshot: document.getElementById("headshot").value.trim(),
        matches: Number(document.getElementById("matches").value) || 0,
        booyah: Number(document.getElementById("booyah").value) || 0,
        guild: document.getElementById("guild").value.trim(),
        language: document.getElementById("language").value.trim(),
        featured: document.getElementById("featured").checked,

        // Social Media

        instagram: document.getElementById("instagram").value.trim(),
        youtube: document.getElementById("youtube").value.trim(),
        discord: document.getElementById("discord").value.trim(),
        facebook: document.getElementById("facebook").value.trim(),

        image: document.getElementById("image").value.trim()
      ? "../images/" + document.getElementById("image").value.trim()
      : "../images/logo/logo.png",

      lastEdited: new Date()

    };
    

    docRef.update(data)

    .then(() => {

        alert("✅ Player Updated Successfully!");

        window.location = "players.html";

    })

    .catch((err) => {

        console.error(err);

        alert("Update Failed!");

    });

});


