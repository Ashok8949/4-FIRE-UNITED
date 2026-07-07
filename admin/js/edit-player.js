const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");

if (!playerId) {

    alert("Player ID Missing!");
    window.location = "players.html";

}

const docRef = db.collection("players").doc(playerId);

let selectedImage = null;

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
    document.getElementById("guild").value = p.guild || "";
    document.getElementById("language").value = p.language || "";

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
        guild: document.getElementById("guild").value.trim(),
        language: document.getElementById("language").value.trim(),

        // Social Media

        instagram: document.getElementById("instagram").value.trim(),
        youtube: document.getElementById("youtube").value.trim(),
        discord: document.getElementById("discord").value.trim(),
        facebook: document.getElementById("facebook").value.trim()

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

// ==========================================
// IMAGE PREVIEW
// ==========================================

const imageInput = document.getElementById("playerImage");

const previewImage = document.getElementById("previewImage");

if (imageInput && previewImage) {

    imageInput.addEventListener("change", (e) => {

        const file = e.target.files[0];

        if (!file) return;

        selectedImage = file;

        previewImage.src = URL.createObjectURL(file);

    });

}