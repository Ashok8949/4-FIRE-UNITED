let allMessages = [];

// Load Messages
db.collection("contactMessages")
.get()
.then((snapshot) => {

    allMessages = [];

    snapshot.forEach((doc) => {

        allMessages.push({
            id: doc.id,
            ...doc.data()
        });

    });

    renderMessages(allMessages);

})
.catch((error) => {

    console.error(error);

});

// Render Table
function renderMessages(list) {

    const table = document.getElementById("messageTable");

    table.innerHTML = "";

    list.forEach((m) => {

        table.innerHTML += `

        <tr>

            <td>${m.name || "-"}</td>

            <td>${m.email || "-"}</td>

            <td>${m.subject || "-"}</td>

            <td>${m.date || "-"}</td>

            <td>${m.status || "New"}</td>

            <td>

                <a href="view-message.html?id=${m.id}" class="edit-btn">

                    <i class="fa-solid fa-eye"></i>

                    View

                </a>

                <button class="delete-btn"
                        onclick="deleteMessage('${m.id}')">

                    <i class="fa-solid fa-trash"></i>

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

}

// Delete
function deleteMessage(id) {

    if (!confirm("Delete this message?")) return;

    db.collection("contactMessages")
    .doc(id)
    .delete()

    .then(() => {

        alert("✅ Message Deleted!");

        location.reload();

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Delete Failed!");

    });

}

// Search
const searchBox = document.getElementById("searchMessage");

if (searchBox) {

    searchBox.addEventListener("keyup", () => {

        const value = searchBox.value.toLowerCase();

        const filtered = allMessages.filter((m) => {

            return (

                (m.name || "").toLowerCase().includes(value) ||
                (m.email || "").toLowerCase().includes(value) ||
                (m.subject || "").toLowerCase().includes(value)

            );

        });

        renderMessages(filtered);

    });

}