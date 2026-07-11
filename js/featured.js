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

        // Owner always first
        if (a.owner === true) return -1;
        if (b.owner === true) return 1;

        // Last edited player after owner
        const editA = a.lastEdited?.toMillis
            ? a.lastEdited.toMillis()
            : new Date(a.lastEdited || 0).getTime();

        const editB = b.lastEdited?.toMillis
            ? b.lastEdited.toMillis()
            : new Date(b.lastEdited || 0).getTime();

        if (editA !== editB) {
            return editB - editA;
        }

        // Remaining players by created date
        const createA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : new Date(a.createdAt || 0).getTime();

        const createB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : new Date(b.createdAt || 0).getTime();

        return createA - createB;

    });

    loadCards();

   

});

function loadCards() {

    const container = document.getElementById("featured-players");

    container.innerHTML = "";

    players.slice(0,3).forEach(player=>{

        container.innerHTML += card(player);

    });

}

function card(p) {

    return `
    <div class="player-card ${p.owner ? "owner-card" : ""}">

        <div class="player-image">

            <img src="${p.image.replace("../","")}" alt="${p.ign}">

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

