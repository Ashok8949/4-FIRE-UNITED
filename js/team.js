db.collection("players")
.get()
.then((snapshot) => {

    const team = document.getElementById("team-grid");

    team.innerHTML = "";

    const allPlayers = [];

    snapshot.forEach((doc) => {

        allPlayers.push({
            id: doc.id,
            ...doc.data()
        });

    });

    // Owner ko hamesha first rakho
   allPlayers.sort((a, b) => {

    // Owner hamesha first
    if (a.owner === true) return -1;
    if (b.owner === true) return 1;

    // Last edited player owner ke baad
    const editA = a.lastEdited?.toMillis
        ? a.lastEdited.toMillis()
        : new Date(a.lastEdited || 0).getTime();

    const editB = b.lastEdited?.toMillis
        ? b.lastEdited.toMillis()
        : new Date(b.lastEdited || 0).getTime();

    if (editA !== editB) {
        return editB - editA; // sabse recently edited pehle
    }

    // Baaki players purane order me
    const createA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : new Date(a.createdAt || 0).getTime();

    const createB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : new Date(b.createdAt || 0).getTime();

    return createA - createB;

});

    // Cards banao
    allPlayers.forEach((p) => {

        team.innerHTML += `

        <div class="team-card ${p.owner ? 'owner-card' : ''}">

            <div class="player-image">

            <img src="${p.image}" alt="${p.ign || p.name}">

                ${p.owner ? `
                <div class="owner-crown">
                <i class="fa-solid fa-crown"></i>
                </div>
                ` : ""}

                 </div>

            <div class="team-info">

              <h2>
                ${p.ign || p.name}

               ${p.owner ? `
               <div class="owner-tag">
                 <i class="fa-solid fa-crown"></i> TEAM OWNER
                </div>
               ` : ""}

              </h2>

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

    });

})
.catch((error) => {

    console.error("Firestore Error:", error);

});