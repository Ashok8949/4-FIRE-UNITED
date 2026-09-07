let allTournaments = [];


// =========================================
// LOAD TOURNAMENTS
// =========================================

db.collection("tournaments")
    .get()
    .then((snapshot) => {

        allTournaments = [];

        snapshot.forEach((doc) => {

            allTournaments.push({

                id: doc.id,

                ...doc.data()

            });

        });


        renderTournaments(allTournaments);

    })
    .catch((error) => {

        console.error(
            "Error loading tournaments:",
            error
        );


        const table =
            document.getElementById(
                "tournamentTable"
            );


        table.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Failed to Load Tournaments</h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

    });


// =========================================
// RENDER TOURNAMENTS
// =========================================

function renderTournaments(list){

    const table =
        document.getElementById(
            "tournamentTable"
        );


    const count =
        document.getElementById(
            "tournamentCount"
        );


    table.innerHTML = "";


    // Count

    count.textContent =
        `${list.length} ${
            list.length === 1
                ? "Tournament"
                : "Tournaments"
        }`;


    // Empty

    if(list.length === 0){

        table.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-trophy"></i>

                <h3>No Tournaments Found</h3>

                <p>
                    No tournament matches your search.
                </p>

            </div>

        `;

        return;

    }


    // Cards

    list.forEach((t) => {


        const title =
            escapeHtml(
                t.title || "-"
            );


        const game =
            escapeHtml(
                t.game || "-"
            );


        const date =
            escapeHtml(
                t.date || "-"
            );


        const prize =
            escapeHtml(
                t.prize || "-"
            );


        const status =
            escapeHtml(
                t.status || "-"
            );


        const statusClass =
            getStatusClass(
                t.status
            );


        table.innerHTML += `

            <div class="tournament-card">


                <!-- HEADER -->

                <div class="tournament-top">


                    <div class="tournament-title-wrap">


                        <div class="tournament-title">

                            ${title}

                        </div>


                        <div class="tournament-game">

                            <i class="fa-solid fa-gamepad"></i>

                            ${game}

                        </div>


                    </div>


                    <div
                        class="status-badge ${statusClass}">

                        <i class="fa-solid fa-circle"></i>

                        ${status}

                    </div>


                </div>


                <!-- DETAILS -->

                <div class="tournament-details">


                    <div class="tournament-detail">

                        <span>

                            Date

                        </span>


                        <strong>

                            <i class="fa-regular fa-calendar"></i>

                            ${date}

                        </strong>

                    </div>


                    <div class="tournament-detail prize">

                        <span>

                            Prize

                        </span>


                        <strong>

                            <i class="fa-solid fa-coins"></i>

                            ${prize}

                        </strong>

                    </div>


                </div>


                <!-- ACTIONS -->

                <div class="tournament-actions">


                    <a

                        href="
                            edit-tournament.html?id=${encodeURIComponent(t.id)}
                        "

                        class="edit-btn"

                    >

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </a>


                    <button

                        class="delete-btn"

                        onclick="
                            deleteTournament('${t.id}')
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
// STATUS CLASS
// =========================================

function getStatusClass(status){

    const value =
        String(status || "")
            .toLowerCase()
            .trim();


    if(
        value === "active" ||
        value === "ongoing" ||
        value === "live"
    ){

        return "active";

    }


    if(
        value === "upcoming" ||
        value === "scheduled"
    ){

        return "upcoming";

    }


    if(
        value === "completed" ||
        value === "complete" ||
        value === "finished"
    ){

        return "completed";

    }


    if(
        value === "cancelled" ||
        value === "canceled"
    ){

        return "cancelled";

    }


    return "";

}


// =========================================
// DELETE TOURNAMENT
// =========================================

function deleteTournament(id){

    const tournament =
        allTournaments.find(
            tournament =>
                tournament.id === id
        );


    const title =
        tournament?.title ||
        "this tournament";


    if(
        !confirm(
            `Delete ${title}?`
        )
    ){

        return;

    }


    db.collection("tournaments")
        .doc(id)
        .delete()
        .then(() => {


            alert(
                "Tournament Deleted Successfully!"
            );


            allTournaments =
                allTournaments.filter(
                    tournament =>
                        tournament.id !== id
                );


            applySearch();


        })
        .catch((error) => {

            console.error(
                "Delete tournament error:",
                error
            );


            alert(
                "Delete Failed!\n\n" +
                error.message
            );

        });

}


// =========================================
// SEARCH
// =========================================

const searchBox =
    document.getElementById(
        "searchTournament"
    );


if(searchBox){

    searchBox.addEventListener(
        "input",
        applySearch
    );

}


// =========================================
// APPLY SEARCH
// =========================================

function applySearch(){

    const value =
        document
            .getElementById(
                "searchTournament"
            )
            .value
            .toLowerCase()
            .trim();


    if(!value){

        renderTournaments(
            allTournaments
        );

        return;

    }


    const filtered =
        allTournaments.filter(
            tournament => {


                const title =
                    String(
                        tournament.title || ""
                    ).toLowerCase();


                const game =
                    String(
                        tournament.game || ""
                    ).toLowerCase();


                const status =
                    String(
                        tournament.status || ""
                    ).toLowerCase();


                const date =
                    String(
                        tournament.date || ""
                    ).toLowerCase();


                const prize =
                    String(
                        tournament.prize || ""
                    ).toLowerCase();


                return (

                    title.includes(value) ||

                    game.includes(value) ||

                    status.includes(value) ||

                    date.includes(value) ||

                    prize.includes(value)

                );

            }
        );


    renderTournaments(
        filtered
    );

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