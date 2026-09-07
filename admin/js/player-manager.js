let allPlayers = [];


// =========================================
// LOAD PLAYERS
// =========================================

db.collection("players")
    .get()
    .then((snapshot) => {

        allPlayers = [];

        snapshot.forEach((doc) => {

            allPlayers.push({

                id: doc.id,

                ...doc.data()

            });

        });


        renderPlayers(allPlayers);

    })
    .catch((error) => {

        console.error(
            "Error loading players:",
            error
        );


        const table =
            document.getElementById("playerTable");


        table.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Failed to Load Players</h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

    });


// =========================================
// RENDER PLAYERS
// =========================================

function renderPlayers(players){

    const table =
        document.getElementById("playerTable");


    const count =
        document.getElementById("playerCount");


    table.innerHTML = "";


    // Count

    count.textContent =
        `${players.length} ${
            players.length === 1
                ? "Player"
                : "Players"
        }`;


    // Empty

    if(players.length === 0){

        table.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-user-slash"></i>

                <h3>No Players Found</h3>

                <p>
                    No player matches your search.
                </p>

            </div>

        `;

        return;

    }


    // Cards

    players.forEach((p) => {


        let image =
            p.image || "";


        if(
            image &&
            !image.startsWith("http")
        ){

            image =
                "../" + image;

        }


        if(!image){

            image =
                "https://via.placeholder.com/150x150.png?text=PLAYER";

        }


        const name =
            escapeHtml(
                p.name || "Unknown Player"
            );


        const ign =
            escapeHtml(
                p.ign || "N/A"
            );


        const role =
            escapeHtml(
                p.role || "N/A"
            );


        const level =
            escapeHtml(
                p.level ?? "N/A"
            );


        const rank =
            escapeHtml(
                p.rank || "N/A"
            );


        table.innerHTML += `

            <div class="player-card">


                <!-- PLAYER HEADER -->

                <div class="player-top">


                    <img

                        class="player-image"

                        src="${image}"

                        alt="${name}"

                        onerror="
                            this.src=
                            'https://via.placeholder.com/150x150.png?text=PLAYER';
                        "

                    >


                    <div class="player-info">


                        <div class="player-name">

                            ${name}

                        </div>


                        <div class="player-ign">

                            <i class="fa-solid fa-gamepad"></i>

                            ${ign}

                        </div>


                    </div>


                </div>


                <!-- DETAILS -->

                <div class="player-details">


                    <div class="player-detail">

                        <span>
                            Role
                        </span>


                        <strong>

                            <span class="role-badge">

                                <i class="fa-solid fa-user"></i>

                                ${role}

                            </span>

                        </strong>

                    </div>


                    <div class="player-detail">

                        <span>
                            Level
                        </span>


                        <strong>

                            ${level}

                        </strong>

                    </div>


                    <div class="player-detail">

                        <span>
                            Rank
                        </span>


                        <strong>

                            ${rank}

                        </strong>

                    </div>


                </div>


                <!-- ACTIONS -->

                <div class="player-actions">


                    <a

                        href="
                            edit-player.html?id=${encodeURIComponent(p.id)}
                        "

                        class="edit-btn"

                    >

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </a>


                    <button

                        class="delete-btn"

                        onclick="
                            deletePlayer('${p.id}')
                        "

                    >

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>


                </div>


            </div>

        `;

    });

}


// =========================================
// DELETE PLAYER
// =========================================

function deletePlayer(id){

    const player =
        allPlayers.find(
            player =>
                player.id === id
        );


    const playerName =
        player?.name ||
        "this player";


    if(
        !confirm(
            `Delete ${playerName}?`
        )
    ){

        return;

    }


    db.collection("players")
        .doc(id)
        .delete()
        .then(() => {


            alert(
                "Player Deleted Successfully"
            );


            allPlayers =
                allPlayers.filter(
                    player =>
                        player.id !== id
                );


            applySearch();


        })
        .catch((error) => {


            console.error(
                "Delete player error:",
                error
            );


            alert(
                "Delete Failed\n\n" +
                error.message
            );

        });

}


// =========================================
// SEARCH
// =========================================

document
    .getElementById("searchPlayer")
    .addEventListener(
        "input",
        applySearch
    );


// =========================================
// APPLY SEARCH
// =========================================

function applySearch(){

    const input =
        document.getElementById(
            "searchPlayer"
        );


    const value =
        input.value
            .toLowerCase()
            .trim();


    if(!value){

        renderPlayers(
            allPlayers
        );

        return;

    }


    const filtered =
        allPlayers.filter(
            player => {


                const name =
                    String(
                        player.name || ""
                    ).toLowerCase();


                const ign =
                    String(
                        player.ign || ""
                    ).toLowerCase();


                const role =
                    String(
                        player.role || ""
                    ).toLowerCase();


                const rank =
                    String(
                        player.rank || ""
                    ).toLowerCase();


                const level =
                    String(
                        player.level || ""
                    ).toLowerCase();


                return (

                    name.includes(value) ||

                    ign.includes(value) ||

                    role.includes(value) ||

                    rank.includes(value) ||

                    level.includes(value)

                );

            }
        );


    renderPlayers(filtered);

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value){

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}