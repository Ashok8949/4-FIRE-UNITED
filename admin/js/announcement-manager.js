let allAnnouncements = [];


// ==========================================
// LOAD ANNOUNCEMENTS
// ==========================================

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

        console.error("Error loading announcements:", error);

        const grid = document.getElementById("announcementGrid");

        if (grid) {

            grid.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>Unable to Load Announcements</h3>

                    <p>
                        Please check your Firebase connection.
                    </p>

                </div>
            `;

        }

    });


// ==========================================
// RENDER ANNOUNCEMENTS
// ==========================================

function renderAnnouncements(list) {

    const grid = document.getElementById("announcementGrid");

    const count = document.getElementById("announcementCount");

    if (!grid) return;


    grid.innerHTML = "";


    if (count) {

        count.textContent =
            `${list.length} ${list.length === 1 ? "Announcement" : "Announcements"}`;

    }


    if (list.length === 0) {

        grid.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-bullhorn"></i>

                <h3>No Announcements Found</h3>

                <p>
                    Add an announcement or try another search.
                </p>

            </div>

        `;

        return;

    }


    list.forEach((a) => {

        const title =
            escapeHtml(a.title || "Untitled Announcement");

        const category =
            escapeHtml(a.category || "General");

        const date =
            escapeHtml(a.date || "No Date");

        const status =
            escapeHtml(a.status || "Active");


        grid.innerHTML += `

            <div class="announcement-card">

                <div class="announcement-top">

                    <div class="announcement-icon">

                        <i class="fa-solid fa-bullhorn"></i>

                    </div>


                    <span class="announcement-status">

                        ${status}

                    </span>

                </div>


                <h3 title="${escapeAttribute(a.title || "")}">

                    ${title}

                </h3>


                <div class="announcement-meta">

                    <span>

                        <i class="fa-solid fa-tag"></i>

                        ${category}

                    </span>


                    <span>

                        <i class="fa-regular fa-calendar"></i>

                        ${date}

                    </span>

                </div>


                <div class="announcement-buttons">

                    <a
                        href="edit-announcement.html?id=${encodeURIComponent(a.id)}"
                        class="edit-btn"
                    >

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </a>


                    <button
                        class="delete-btn"
                        onclick="deleteAnnouncement('${escapeAttribute(a.id)}')"
                    >

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>

                </div>

            </div>

        `;

    });

}


// ==========================================
// SEARCH
// ==========================================

const searchBox =
    document.getElementById("searchAnnouncement");


if (searchBox) {

    searchBox.addEventListener("input", () => {

        const value =
            searchBox.value.trim().toLowerCase();


        if (!value) {

            renderAnnouncements(allAnnouncements);

            return;

        }


        const filtered =
            allAnnouncements.filter((a) => {

                return (

                    (a.title || "")
                        .toLowerCase()
                        .includes(value)

                    ||

                    (a.category || "")
                        .toLowerCase()
                        .includes(value)

                    ||

                    (a.status || "")
                        .toLowerCase()
                        .includes(value)

                );

            });


        renderAnnouncements(filtered);

    });

}


// ==========================================
// DELETE ANNOUNCEMENT
// ==========================================

function deleteAnnouncement(id) {

    if (!confirm("Delete this announcement?")) {
        return;
    }


    db.collection("announcements")
        .doc(id)
        .delete()
        .then(() => {

            allAnnouncements =
                allAnnouncements.filter(
                    announcement => announcement.id !== id
                );


            renderAnnouncements(allAnnouncements);

        })
        .catch((error) => {

            console.error(
                "Delete announcement error:",
                error
            );

            alert(
                "❌ Delete Failed!\n\n" +
                error.message
            );

        });

}


// ==========================================
// SECURITY / HTML ESCAPE
// ==========================================

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}