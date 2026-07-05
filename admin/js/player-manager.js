db.collection("players")
.get()
.then((snapshot) => {

    const table = document.getElementById("playerTable");

    table.innerHTML = "";

    snapshot.forEach((doc) => {

        const id = doc.id;
        const p = doc.data();

        table.innerHTML += `

        <tr>

            <td>
                <img src="../${p.image}" width="70">
            </td>

            <td>${p.name}</td>

            <td>${p.ign}</td>

            <td>${p.role}</td>

            <td>${p.level}</td>

            <td>${p.rank}</td>

            <td>

                <a href="edit-player.html?id=${id}" class="edit-btn">
                    Edit
                </a>

            </td>

        </tr>

        `;

    });

})
.catch((error)=>{

    console.log(error);

});