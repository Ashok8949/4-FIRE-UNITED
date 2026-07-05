db.collection("players")
.get()
.then((snapshot) => {

    const team = document.getElementById("team-grid");

    team.innerHTML = "";

    snapshot.forEach((doc) => {

        const key = doc.id;
        const p = doc.data();

        team.innerHTML += `

        <div class="team-card">

            <img src="${p.image}" alt="${p.name}">

            <div class="team-info">

                <h2>${p.name}</h2>

                <span>${p.role}</span>

                <div class="mini-stats">

                    <p>❤️ Level ${p.level}</p>

                    <p>🎯 HS ${p.headshot}</p>

                    <p>⚔️ KD ${p.kd}</p>

                </div>

                <a href="players/player.html?id=${key}" class="btn1">
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