db.collection("tournaments")
.get()
.then((snapshot) => {

    const table = document.getElementById("tournamentTable");

    table.innerHTML = "";

    snapshot.forEach((doc) => {

        const t = doc.data();

        table.innerHTML += `

        <tr>

            <td>${t.title || "-"}</td>

            <td>${t.game || "-"}</td>

            <td>${t.date || "-"}</td>

            <td>${t.prize || "-"}</td>

            <td>${t.status || "-"}</td>

            <td>

                <a href="edit-tournament.html?id=${doc.id}" class="edit-btn">
                    Edit
                </a>

                <button class="delete-btn" data-id="${doc.id}">
                    Delete
                </button>

            </td>

        </tr>

        `;

    });

    // Delete Tournament
    document.querySelectorAll(".delete-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            const id = btn.getAttribute("data-id");

            if (confirm("Delete this tournament?")) {

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

        });

    });

})
.catch((error) => {

    console.error(error);

});