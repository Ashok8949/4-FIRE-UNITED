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
       

        document.title = `${p.ign || "Player"} | 4 FIRE UNITED`;

        document.getElementById("player-name").textContent = p.ign || "";
        document.getElementById("player-role").textContent = p.role || "";
        const roleCopy = document.getElementById("player-role-copy");

if(roleCopy){

    roleCopy.textContent = p.role || "";

}
        document.getElementById("player-uid").textContent = p.uid || "";
        document.getElementById("player-level").textContent = p.level || "";
        const badge = document.getElementById("player-level-badge");

if (badge) {

    badge.textContent = p.level || "";

}
        document.getElementById("player-rank").textContent = p.rank || "";
        const rankBadge = document.getElementById("player-rank-badge");

if(rankBadge){

    rankBadge.className = "rank-badge";

    const rank = (p.rank || "").toLowerCase();

    if(rank.includes("heroic")){

        rankBadge.classList.add("heroic");

    }

    else if(rank.includes("grand")){

        rankBadge.classList.add("grandmaster");

    }

    else if(rank.includes("master")){

        rankBadge.classList.add("master");

    }

    else if(rank.includes("diamond")){

        rankBadge.classList.add("diamond");

    }

    else if(rank.includes("platinum")){

        rankBadge.classList.add("platinum");

    }

    else{

        rankBadge.classList.add("gold");

    }

}
        document.getElementById("player-kd").textContent = p.kd || "";
        document.getElementById("player-headshot").textContent = p.headshot || "";
        document.getElementById("player-booyah").textContent = p.booyah || "-";
        document.getElementById("player-matches").textContent = p.matches || "-";
        const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
};

setText("player-kd-copy", p.kd || "");
setText("player-headshot-copy", p.headshot || "");
setText("player-booyah-copy", p.booyah || "-");
setText("player-matches-copy", p.matches || "-");
        document.getElementById("player-guild").textContent = p.guild || "";
        document.getElementById("player-language").textContent = p.language || "";

        const country = document.getElementById("player-country");
        const flag = document.getElementById("player-flag");

if(flag){

    const code = {

        "India":"in",
        "Bangladesh":"bd",
        "Nepal":"np",
        "Pakistan":"pk",
        "Brazil":"br",
        "Indonesia":"id",
        "Thailand":"th",
        "Vietnam":"vn",
        "United States":"us",
        "Russia":"ru"

    };

    const countryCode =
        code[p.country] || "in";

    flag.src =
`https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;

}

if (country) {
    country.textContent = p.country || "India";
}

const since = document.getElementById("player-since");

if (since) {
    since.textContent = p.since || "2024";
}

        const playerImage = document.getElementById("player-image");

playerImage.src = p.image || "../images/logo/logo.png";


        /* ==========================
   FAVORITE WEAPON
========================== */

const weaponName = document.getElementById("player-weapon");
const weaponType = document.getElementById("player-weapon-type");
const weaponQuote = document.getElementById("player-weapon-quote");
const weaponImage = document.getElementById("player-weapon-image");

if (weaponName) {
    weaponName.textContent = p.weaponName || "M1887";
}

if (weaponType) {
    weaponType.textContent = p.weaponType || "SHOTGUN";
}

if (weaponQuote) {
    weaponQuote.textContent =
        p.weaponQuote || "No favorite quote";
}

if (weaponImage) {

    weaponImage.src =
    p.weaponImage || "../images/logo/logo.png";

}

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
/* ==========================
   WEAPON PARALLAX
========================== */

const weaponCard = document.querySelector(".weapon-card");
const weaponImg = document.querySelector(".weapon-image img");

if (weaponCard && weaponImg) {

    weaponCard.addEventListener("mousemove", (e) => {

        const rect = weaponCard.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const moveX = (x - rect.width / 2) / 20;
        const moveY = (y - rect.height / 2) / 20;

        weaponImg.style.transform =
            `translate(${moveX}px, ${moveY}px) rotate(${moveX / 2}deg) scale(1.08)`;

    });

    weaponCard.addEventListener("mouseleave", () => {

        weaponImg.style.transform =
            "translate(0,0) rotate(0deg) scale(1)";

    });

}