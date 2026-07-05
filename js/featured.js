fetch("data/players.json")
.then(res => res.json())
.then(data => {

    const container = document.getElementById("featured-players");

    container.innerHTML = "";

    let count = 0;

    Object.keys(data).forEach(key => {

        if(count >= 3) return;

        const p = data[key];

        container.innerHTML += `

        <div class="player-card">

            <img src="${p.image.replace("../","")}" alt="${p.name}">

            <h3>${p.name}</h3>

            <p>${p.role}</p>

            <a href="players/player.html?id=${key}">
                View Profile
            </a>

        </div>

        `;

        count++;

    });

});