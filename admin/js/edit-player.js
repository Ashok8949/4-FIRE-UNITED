const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");

if (!playerId) {
    alert("Player ID Missing!");
    window.location = "players.html";
}

const docRef = db.collection("players").doc(playerId);
let selectedImage = null;

// Load Player Data
docRef.get().then((doc) => {

    if (!doc.exists) {
        alert("Player Not Found!");
        window.location = "players.html";
        return;
    }

    const p = doc.data();

    document.getElementById("name").value = p.name;
    document.getElementById("ign").value = p.ign;
    document.getElementById("uid").value = p.uid;
    document.getElementById("role").value = p.role;
    document.getElementById("level").value = p.level;
    document.getElementById("rank").value = p.rank;
    document.getElementById("kd").value = p.kd;
    document.getElementById("headshot").value = p.headshot;
    document.getElementById("guild").value = p.guild;
    document.getElementById("language").value = p.language;

}).catch((err) => {

    console.error(err);

});

// Save Player
document.getElementById("saveBtn").addEventListener("click", () => {

    const data = {

        name: document.getElementById("name").value,
        ign: document.getElementById("ign").value,
        uid: document.getElementById("uid").value,
        role: document.getElementById("role").value,
        level: Number(document.getElementById("level").value),
        rank: document.getElementById("rank").value,
        kd: document.getElementById("kd").value,
        headshot: document.getElementById("headshot").value,
        guild: document.getElementById("guild").value,
        language: document.getElementById("language").value

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