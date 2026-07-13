const params = new URLSearchParams(window.location.search);
const playerKey = params.get("id");

if (!playerKey) {

    alert("Player not found!");

} else {

    db.collection("players")
    .doc(playerKey)
    .get()

    .then((doc) => {

        if (!doc.exists) {

            alert("Player not found!");

            return;

        }

        const p = doc.data();

        document.title = p.ign + " | 4 FIRE UNITED";

        document.getElementById("player-name").textContent = p.ign || "";
        document.getElementById("player-role").textContent = p.role || "";
        document.getElementById("player-uid").textContent = p.uid || "";
        document.getElementById("player-level").textContent = p.level || "";
        document.getElementById("player-rank").textContent = p.rank || "";
        document.getElementById("player-kd").textContent = p.kd || "";
        document.getElementById("player-headshot").textContent = p.headshot || "";
        document.getElementById("player-booyah").textContent = p.booyah || "-";
        document.getElementById("player-matches").textContent = p.matches || "-";
        document.getElementById("player-guild").textContent = p.guild || "";
        document.getElementById("player-language").textContent = p.language || "";

        document.getElementById("player-image").src =
    p.image.startsWith("http")
        ? p.image
        : "../" + p.image;

        // ==========================
        // PLAYER SOCIAL MEDIA
        // ==========================

        const socials = [

            {
                id: "playerInstagram",
                url: p.instagram
            },

            {
                id: "playerYoutube",
                url: p.youtube
            },

            {
                id: "playerDiscord",
                url: p.discord
            },

            {
                id: "playerFacebook",
                url: p.facebook
            }

        ];

        socials.forEach((social) => {

            const btn = document.getElementById(social.id);

            if (!btn) return;

            if (social.url && social.url.trim() !== "") {

                btn.href = social.url;
                btn.target = "_blank";
                btn.rel = "noopener noreferrer";

            } else {

                btn.style.display = "none";

            }

        });

    })

    .catch((error) => {

        console.error(error);

    });

}