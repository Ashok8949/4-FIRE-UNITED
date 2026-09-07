let allApplications = [];

let selectedApplications = [];

let allSelected = false;


// ==========================================
// LOAD APPLICATIONS
// ==========================================

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
    .catch((error) => {

        console.error(
            "Error loading applications:",
            error
        );

        const table =
            document.getElementById("applicationTable");

        if (table) {

            table.innerHTML = `

                <tr>

                    <td colspan="8">

                        <div class="empty-application">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                            <h3>Unable to Load Applications</h3>

                            <p>
                                Please check your Firebase connection.
                            </p>

                        </div>

                    </td>

                </tr>

            `;

        }

    });


// ==========================================
// RENDER APPLICATIONS
// ==========================================

function renderApplications(list) {

    allSelected = false;

    selectedApplications = [];


    const selectAllBtn =
        document.getElementById("selectAllBtn");


    if (selectAllBtn) {

        selectAllBtn.innerHTML = `
            <i class="fa-solid fa-check-double"></i>
            Select All
        `;

    }


    const masterCheck =
        document.getElementById("masterCheck");


    if (masterCheck) {

        masterCheck.checked = false;

    }


    const table =
        document.getElementById("applicationTable");


    const count =
        document.getElementById("applicationCount");


    if (!table) return;


    table.innerHTML = "";


    if (count) {

        count.textContent =
            `${list.length} ${list.length === 1 ? "Application" : "Applications"}`;

    }


    if (list.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty-application">

                        <i class="fa-solid fa-file-circle-xmark"></i>

                        <h3>No Applications Found</h3>

                        <p>
                            No player applications match your search.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    list.forEach((a) => {

        const name =
            escapeHtml(a.name || "-");

        const ign =
            escapeHtml(a.ign || "-");

        const uid =
            escapeHtml(a.uid || "-");

        const email =
            escapeHtml(a.email || "-");

        const rank =
            escapeHtml(a.rank || "-");

        const status =
            escapeHtml(a.status || "Pending");


        table.innerHTML += `

            <tr>

                <td>

                    <input
                        type="checkbox"
                        class="application-check"
                        value="${escapeAttribute(a.id)}"
                        onchange="toggleApplication('${escapeAttribute(a.id)}', this.checked)"
                    >

                </td>


                <td>

                    <span class="application-name">
                        ${name}
                    </span>

                </td>


                <td>

                    <span class="application-ign">
                        ${ign}
                    </span>

                </td>


                <td>
                    ${uid}
                </td>


                <td>

                    <span class="application-email">
                        ${email}
                    </span>

                </td>


                <td>
                    ${rank}
                </td>


                <td>

                    <span class="application-status">
                        ${status}
                    </span>

                </td>


                <td>

                    <div class="application-actions">

                        <a
                            href="view-application.html?id=${encodeURIComponent(a.id)}"
                            class="edit-btn"
                        >

                            <i class="fa-solid fa-eye"></i>

                            View

                        </a>


                        <button
                            class="edit-btn accept-btn"
                            onclick="updateStatus('${escapeAttribute(a.id)}', 'Accepted')"
                        >

                            <i class="fa-solid fa-check"></i>

                            Accept

                        </button>


                        <button
                            class="edit-btn reject-btn"
                            onclick="updateStatus('${escapeAttribute(a.id)}', 'Rejected')"
                        >

                            <i class="fa-solid fa-xmark"></i>

                            Reject

                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteApplication('${escapeAttribute(a.id)}')"
                        >

                            <i class="fa-solid fa-trash"></i>

                            Delete

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// ==========================================
// UPDATE STATUS
// ==========================================

function updateStatus(id, status) {

    db.collection("joinApplications")
        .doc(id)
        .update({
            status: status
        })
        .then(() => {

            const application =
                allApplications.find(
                    app => app.id === id
                );


            if (application) {

                application.status = status;

            }


            const search =
                document.getElementById("searchApplication");


            if (search && search.value.trim()) {

                performApplicationSearch();

            } else {

                renderApplications(allApplications);

            }

        })
        .catch((error) => {

            console.error(
                "Status update error:",
                error
            );

            alert(
                "❌ Failed to update status!\n\n" +
                error.message
            );

        });

}


// ==========================================
// DELETE APPLICATION
// ==========================================

function deleteApplication(id) {

    if (
        !confirm(
            "Are you sure you want to delete this application?"
        )
    ) {

        return;

    }


    db.collection("joinApplications")
        .doc(id)
        .delete()
        .then(() => {

            allApplications =
                allApplications.filter(
                    application =>
                        application.id !== id
                );


            selectedApplications =
                selectedApplications.filter(
                    applicationId =>
                        applicationId !== id
                );


            renderApplications(allApplications);

        })
        .catch((error) => {

            console.error(
                "Delete application error:",
                error
            );

            alert(
                "❌ Failed to delete application!\n\n" +
                error.message
            );

        });

}


// ==========================================
// SEARCH
// ==========================================

const search =
    document.getElementById("searchApplication");


if (search) {

    search.addEventListener("input", () => {

        performApplicationSearch();

    });

}


function performApplicationSearch() {

    const searchBox =
        document.getElementById("searchApplication");


    if (!searchBox) return;


    const value =
        searchBox.value
            .trim()
            .toLowerCase();


    if (!value) {

        renderApplications(allApplications);

        return;

    }


    const filtered =
        allApplications.filter((a) => {

            return (

                (a.name || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (a.ign || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (a.uid || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (a.email || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (a.rank || "")
                    .toLowerCase()
                    .includes(value)

                ||

                (a.status || "")
                    .toLowerCase()
                    .includes(value)

            );

        });


    renderApplications(filtered);

}


// ==========================================
// TOGGLE SINGLE APPLICATION
// ==========================================

function toggleApplication(id, checked) {

    if (checked) {

        if (
            !selectedApplications.includes(id)
        ) {

            selectedApplications.push(id);

        }

    } else {

        selectedApplications =
            selectedApplications.filter(
                x => x !== id
            );

    }


    updateApplicationSelectionState();

}


// ==========================================
// SELECT ALL BUTTON
// ==========================================

const selectAllBtn =
    document.getElementById("selectAllBtn");


if (selectAllBtn) {

    selectAllBtn.onclick = () => {

        const checks =
            document.querySelectorAll(
                ".application-check"
            );


        selectedApplications = [];

        allSelected = !allSelected;


        checks.forEach((checkbox) => {

            checkbox.checked =
                allSelected;


            if (allSelected) {

                selectedApplications.push(
                    checkbox.value
                );

            }

        });


        updateApplicationSelectionButton();

        updateApplicationMasterCheckbox();

    };

}


// ==========================================
// MASTER CHECKBOX
// ==========================================

const masterCheck =
    document.getElementById("masterCheck");


if (masterCheck) {

    masterCheck.addEventListener(
        "change",
        () => {

            const checks =
                document.querySelectorAll(
                    ".application-check"
                );


            selectedApplications = [];

            allSelected =
                masterCheck.checked;


            checks.forEach((checkbox) => {

                checkbox.checked =
                    allSelected;


                if (allSelected) {

                    selectedApplications.push(
                        checkbox.value
                    );

                }

            });


            updateApplicationSelectionButton();

        }
    );

}


// ==========================================
// UPDATE SELECTION STATE
// ==========================================

function updateApplicationSelectionState() {

    const checks =
        document.querySelectorAll(
            ".application-check"
        );


    allSelected =
        checks.length > 0 &&
        selectedApplications.length ===
        checks.length;


    updateApplicationSelectionButton();

    updateApplicationMasterCheckbox();

}


// ==========================================
// UPDATE SELECT BUTTON
// ==========================================

function updateApplicationSelectionButton() {

    const btn =
        document.getElementById("selectAllBtn");


    if (!btn) return;


    btn.innerHTML = allSelected

        ? `
            <i class="fa-solid fa-square-minus"></i>
            Unselect All
          `

        : `
            <i class="fa-solid fa-check-double"></i>
            Select All
          `;

}


// ==========================================
// UPDATE MASTER CHECKBOX
// ==========================================

function updateApplicationMasterCheckbox() {

    const master =
        document.getElementById("masterCheck");


    const checks =
        document.querySelectorAll(
            ".application-check"
        );


    if (!master) return;


    master.checked =
        checks.length > 0 &&
        selectedApplications.length ===
        checks.length;

}


// ==========================================
// DELETE SELECTED
// ==========================================

const deleteSelectedBtn =
    document.getElementById(
        "deleteSelectedBtn"
    );


if (deleteSelectedBtn) {

    deleteSelectedBtn.onclick =
        async () => {

            if (
                selectedApplications.length === 0
            ) {

                alert(
                    "Select applications first."
                );

                return;

            }


            if (
                !confirm(
                    `Delete ${selectedApplications.length} selected application(s)?`
                )
            ) {

                return;

            }


            const batch = db.batch();


            selectedApplications.forEach(
                (id) => {

                    batch.delete(
                        db.collection(
                            "joinApplications"
                        ).doc(id)
                    );

                }
            );


            try {

                await batch.commit();


                const deletedIds =
                    new Set(
                        selectedApplications
                    );


                allApplications =
                    allApplications.filter(
                        application =>
                            !deletedIds.has(
                                application.id
                            )
                    );


                selectedApplications = [];

                allSelected = false;


                renderApplications(
                    allApplications
                );

            }
            catch (error) {

                console.error(
                    "Bulk delete error:",
                    error
                );

                alert(
                    "❌ Failed to delete applications.\n\n" +
                    error.message
                );

            }

        };

}


// ==========================================
// HTML ESCAPE
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