let allAnnouncements = [];

db.collection("announcements")
.get()
.then((snapshot) => {

    allAnnouncements = [];

    snapshot.forEach((doc) => {

        allAnnouncements.push({
            id: doc.id,
            ...doc.data()
        });

    });

    renderAnnouncements(allAnnouncements);

})
.catch((error) => {

    console.error(error);

});

function renderAnnouncements(list) {

    const table = document.getElementById("announcementTable");

    table.innerHTML = "";

    list.forEach((a) => {

        table.innerHTML += `

        <tr>

            <td>${a.title || "-"}</td>

            <td>${a.category || "-"}</td>

            <td>${a.date || "-"}</td>

            <td>${a.status || "-"}</td>

            <td>

                <a href="edit-announcement.html?id=${a.id}" class="edit-btn">
                    <i class="fa-solid fa-pen"></i> Edit
                </a>

                <button class="delete-btn"
                        onclick="deleteAnnouncement('${a.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>

            </td>

        </tr>

        `;

    });

}

function deleteAnnouncement(id) {

    if (!confirm("Delete this announcement?")) return;

    db.collection("announcements")
    .doc(id)
    .delete()

    .then(() => {

        alert("✅ Announcement Deleted Successfully!");

        location.reload();

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Delete Failed!");

    });

}

const searchBox = document.getElementById("searchAnnouncement");

if (searchBox) {

    searchBox.addEventListener("keyup", () => {

        const value = searchBox.value.toLowerCase();

        const filtered = allAnnouncements.filter((a) => {

            return (

                (a.title || "").toLowerCase().includes(value) ||
                (a.category || "").toLowerCase().includes(value) ||
                (a.status || "").toLowerCase().includes(value)

            );

        });

        renderAnnouncements(filtered);

    });

}