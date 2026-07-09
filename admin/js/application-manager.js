let allApplications = [];

// ===============================
// Load Applications
// ===============================

db.collection("joinApplications")
.get()
.then((snapshot) => {

    allApplications = [];

    snapshot.forEach((doc) => {

        allApplications.push({
            id: doc.id,
            ...doc.data()
        });

    });

    renderApplications(allApplications);

})
.catch((err) => {

    console.error(err);

});

// ===============================
// Render Table
// ===============================

function renderApplications(list) {

    const table = document.getElementById("applicationTable");

    table.innerHTML = "";

    list.forEach((a) => {

        table.innerHTML += `

        <tr>

            <td>${a.name || "-"}</td>

            <td>${a.ign || "-"}</td>

            <td>${a.uid || "-"}</td>

            <td>${a.email || "-"}</td>

            <td>${a.rank || "-"}</td>

            <td>${a.status || "Pending"}</td>

            <td>

                <a href="view-application.html?id=${a.id}" class="edit-btn">

                    <i class="fa-solid fa-eye"></i>

                    View

                </a>

                <button class="edit-btn"
                        onclick="updateStatus('${a.id}','Accepted')">

                    Accept

                </button>

                <button class="edit-btn"
                        onclick="updateStatus('${a.id}','Rejected')">

                    Reject

                </button>

                <button class="delete-btn"
                        onclick="deleteApplication('${a.id}')">

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

}

// ===============================
// Update Status
// ===============================

function updateStatus(id, status) {

    db.collection("joinApplications")
    .doc(id)
    .update({

        status: status

    })

    .then(() => {

        alert("✅ Status Updated!");

        location.reload();

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Failed!");

    });

}

// ===============================
// Delete Application
// ===============================

function deleteApplication(id) {

    if (!confirm("Are you sure you want to delete this application?")) {
        return;
    }

    db.collection("joinApplications")
    .doc(id)
    .delete()

    .then(() => {

        alert("🗑️ Application Deleted Successfully!");

        location.reload();

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Failed to delete application!");

    });

}

// ===============================
// Search
// ===============================

const search = document.getElementById("searchApplication");

if (search) {

    search.addEventListener("keyup", () => {

        const value = search.value.toLowerCase();

        const filtered = allApplications.filter((a) => {

            return (

                (a.name || "").toLowerCase().includes(value) ||
                (a.ign || "").toLowerCase().includes(value) ||
                (a.uid || "").toLowerCase().includes(value) ||
                (a.email || "").toLowerCase().includes(value) ||
                (a.rank || "").toLowerCase().includes(value)

            );

        });

        renderApplications(filtered);

    });

}