let players = [];
let current = 0;

db.collection("players")
.get()
.then((snapshot)=>{

    snapshot.forEach(doc=>{

        players.push({
            id:doc.id,
            ...doc.data()
        });

    });

    loadCards();

    if(players.length>3){

        let autoSlide = setInterval(nextSlide,5000);

const container = document.getElementById("featured-players");

container.addEventListener("mouseenter",()=>{

    clearInterval(autoSlide);

});

container.addEventListener("mouseleave",()=>{

    autoSlide = setInterval(nextSlide,5000);

});

    }

});

function loadCards(){

    const container = document.getElementById("featured-players");

    const html = [];

    for(let i=0;i<3;i++){

        const player = players[(current+i)%players.length];

        html.push(card(player));

    }

    container.innerHTML = html.join("");

}

function card(p){

    return `
    <div class="player-card">

        <img src="${p.image.replace("../","")}" alt="${p.ign}">

        <div class="player-info">

            <h3>${p.ign}</h3>

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

function nextSlide(){

    const container = document.getElementById("featured-players");

    container.style.opacity = "0";
    container.style.transform = "translateX(-60px)";

    setTimeout(()=>{

        current++;

        if(current >= players.length){

           current = 0;

        }

        if(current === players.length - 2){
         current = 0;
        }

        loadCards();

        container.style.opacity = "1";
        container.style.transform = "translateX(0)";

    },300);

}