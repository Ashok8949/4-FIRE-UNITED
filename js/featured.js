let players = [];
let current = 0;

db.collection("players")
.where("featured", "==", true)
.get()
.then((snapshot) => {

    snapshot.forEach((doc) => {

        players.push({
            id: doc.id,
            ...doc.data()
        });

    });

    // Sort players
   players.sort((a, b) => {

    // Owner hamesha first
    if (a.owner === true) return -1;
    if (b.owner === true) return 1;

    // Display Order
    const orderA = Number(a.displayOrder || 9999);
    const orderB = Number(b.displayOrder || 9999);

    if (orderA !== orderB) {

        return orderA - orderB;

    }

    // Same order ho to name se sort
    return (a.name || "").localeCompare(b.name || "");

});

    loadCards();

   

});

function loadCards() {

    const container = document.getElementById("featured-players");

    container.innerHTML = "";

    let html = "";

    players.slice(0,3).forEach(player => {

        html += card(player);

    });

    container.innerHTML = html;

}

function card(p) {

    return `
    <div class="player-card ${p.owner ? "owner-card" : ""}">

        <div class="player-image">

            <img
    src="${p.image.replace("../","")}"
    alt="${p.ign}"
    loading="lazy"
    decoding="async">

            ${p.owner ? `
                <div class="owner-crown">
                    <i class="fa-solid fa-crown"></i>
                </div>
            ` : ""}

        </div>

             <div class="player-info">

               <div class="player-title">

    <h3>${p.ign}</h3>

    ${p.owner ? `
    <span class="owner-badge">
        <i class="fa-solid fa-crown"></i>
        OWNER
    </span>
    ` : ""}

</div>

    <span>${p.role}</span>
            <div class="mini-stats">

                <p>❤️ Level ${p.level || "-"}</p>

                <p>🎯 HS ${p.headshot || "-"}</p>

                <p>⚔️ KD ${p.kd || "-"}</p>

            </div>

            <a href="players/player.html?id=${p.id}" class="btn1">
                View Profile
            </a>

        </div>

    </div>
    `;

}

