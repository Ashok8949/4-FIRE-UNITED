const imageInput = document.getElementById("image");
const previewImage = document.getElementById("previewImage");

let selectedImage = null;

if (imageInput && previewImage) {

    imageInput.addEventListener("change", (e) => {

        const file = e.target.files[0];

        if (!file) return;

        selectedImage = file;

        previewImage.src = URL.createObjectURL(file);

    });

}
document.getElementById("savePlayer").addEventListener("click", () => {

    const player = {

        name: document.getElementById("name").value.trim(),
        ign: document.getElementById("ign").value.trim(),
        uid: document.getElementById("uid").value.trim(),
        guild: document.getElementById("guild").value.trim(),
        role: document.getElementById("role").value.trim(),
        language: document.getElementById("language").value.trim(),

        level: Number(document.getElementById("level").value),
        rank: document.getElementById("rank").value.trim(),
        kd: document.getElementById("kd").value.trim(),
        headshot: document.getElementById("headshot").value.trim(),

        image: "../images/logo/logo.png"

    };

    if (
        !player.name ||
        !player.ign ||
        !player.uid
    ) {

        alert("Please fill all required fields.");
        return;

    }

    db.collection("players")
    .add(player)

    .then(() => {

        alert("✅ Player Added Successfully!");

        window.location.href = "players.html";

    })

    .catch((err) => {

        console.error(err);
        alert("Failed to Add Player.");

    });

});