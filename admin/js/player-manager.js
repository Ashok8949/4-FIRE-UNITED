let allPlayers = [];

// =============================
// Load Players
// =============================
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

    console.error(error);

});

// =============================
// Render Players
// =============================
function renderPlayers(players){

    const table = document.getElementById("playerTable");

    table.innerHTML = "";

    players.forEach((p)=>{

        table.innerHTML += `

        <tr>

            <td>
                <img
    src="${
        p.image.startsWith("http")
            ? p.image
            : "../" + p.image
    }"
    width="70">
            </td>

            <td>${p.name}</td>

            <td>${p.ign}</td>

            <td>${p.role}</td>

            <td>${p.level}</td>

            <td>${p.rank}</td>

            <td>

                <a href="edit-player.html?id=${p.id}" class="edit-btn">
                    <i class="fa-solid fa-pen"></i> Edit
                </a>

                <button class="delete-btn"
                onclick="deletePlayer('${p.id}')">

                    <i class="fa-solid fa-trash"></i>

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

}

// =============================
// Delete Player
// =============================
function deletePlayer(id){

    if(confirm("Delete this player?")){

        db.collection("players")
        .doc(id)
        .delete()
        .then(()=>{

            alert("Player Deleted Successfully");

            allPlayers = allPlayers.filter(player => player.id !== id);

            renderPlayers(allPlayers);

        })
        .catch((error)=>{

            console.error(error);

            alert("Delete Failed");

        });

    }

}

// =============================
// Live Search
// =============================
document.getElementById("searchPlayer")
.addEventListener("keyup", function(){

    const value = this.value.toLowerCase();

    const filtered = allPlayers.filter(player =>

        player.name.toLowerCase().includes(value) ||

        player.ign.toLowerCase().includes(value) ||

        player.role.toLowerCase().includes(value)

    );

    renderPlayers(filtered);

});