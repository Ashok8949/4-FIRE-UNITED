let allTournaments = [];

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

    console.error(error);

});

function renderTournaments(list) {

    const table = document.getElementById("tournamentTable");

    table.innerHTML = "";

    list.forEach((t) => {

        table.innerHTML += `

        <tr>

            <td>${t.title || "-"}</td>

            <td>${t.game || "-"}</td>

            <td>${t.date || "-"}</td>

            <td>${t.prize || "-"}</td>

            <td>${t.status || "-"}</td>

            <td>

                <a href="edit-tournament.html?id=${t.id}" class="edit-btn">
                    <i class="fa-solid fa-pen"></i> Edit
                </a>

                <button class="delete-btn"
                        onclick="deleteTournament('${t.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>

            </td>

        </tr>

        `;

    });

}

function deleteTournament(id) {

    if (!confirm("Delete this tournament?")) return;

    db.collection("tournaments")
    .doc(id)
    .delete()
    .then(() => {

        alert("✅ Tournament Deleted Successfully!");

        location.reload();

    })
    .catch((err) => {

        console.error(err);

        alert("❌ Delete Failed!");

    });

}

const searchBox = document.getElementById("searchTournament");

if (searchBox) {

    searchBox.addEventListener("keyup", () => {

        const value = searchBox.value.toLowerCase();

        const filtered = allTournaments.filter((t) => {

            return (
                (t.title || "").toLowerCase().includes(value) ||
                (t.game || "").toLowerCase().includes(value) ||
                (t.status || "").toLowerCase().includes(value)
            );

        });

        renderTournaments(filtered);

    });

}