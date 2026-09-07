let allMessages = [];

let selectedMessages = [];

let allSelected = false;


// ==========================================
// LOAD MESSAGES
// ==========================================

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

        console.error("Error loading messages:", error);

        const table = document.getElementById("messageTable");

        if (table) {

            table.innerHTML = `

                <tr>

                    <td colspan="7">

                        <div class="empty-message">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                            <h3>Unable to Load Messages</h3>

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
// RENDER MESSAGES
// ==========================================

function renderMessages(list) {

    allSelected = false;

    selectedMessages = [];


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
        document.getElementById("messageTable");

    const count =
        document.getElementById("messageCount");


    if (!table) return;


    table.innerHTML = "";


    if (count) {

        count.textContent =
            `${list.length} ${list.length === 1 ? "Message" : "Messages"}`;

    }


    if (list.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-message">

                        <i class="fa-solid fa-envelope-open"></i>

                        <h3>No Messages Found</h3>

                        <p>
                            No contact messages match your search.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    list.forEach((m) => {

        const name =
            escapeHtml(m.name || "-");

        const email =
            escapeHtml(m.email || "-");

        const subject =
            escapeHtml(m.subject || "-");

        const date =
            escapeHtml(m.date || "-");

        const status =
            escapeHtml(m.status || "New");


        table.innerHTML += `

            <tr>

                <td>

                    <input
                        type="checkbox"
                        class="message-check"
                        value="${escapeAttribute(m.id)}"
                        onchange="toggleMessage('${escapeAttribute(m.id)}', this.checked)"
                    >

                </td>


                <td>

                    <span class="message-name">
                        ${name}
                    </span>

                </td>


                <td>

                    <span class="message-email">
                        ${email}
                    </span>

                </td>


                <td>

                    <div
                        class="message-subject"
                        title="${escapeAttribute(m.subject || "-")}"
                    >
                        ${subject}
                    </div>

                </td>


                <td>
                    ${date}
                </td>


                <td>

                    <span class="message-status">
                        ${status}
                    </span>

                </td>


                <td>

                    <a
                        href="view-message.html?id=${encodeURIComponent(m.id)}"
                        class="edit-btn"
                    >

                        <i class="fa-solid fa-eye"></i>

                        View

                    </a>


                    <button
                        class="delete-btn"
                        onclick="deleteMessage('${escapeAttribute(m.id)}')"
                    >

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>

                </td>

            </tr>

        `;

    });

}


// ==========================================
// SEARCH
// ==========================================

const searchBox =
    document.getElementById("searchMessage");


if (searchBox) {

    searchBox.addEventListener("input", () => {

        const value =
            searchBox.value
                .trim()
                .toLowerCase();


        if (!value) {

            renderMessages(allMessages);

            return;

        }


        const filtered =
            allMessages.filter((m) => {

                return (

                    (m.name || "")
                        .toLowerCase()
                        .includes(value)

                    ||

                    (m.email || "")
                        .toLowerCase()
                        .includes(value)

                    ||

                    (m.subject || "")
                        .toLowerCase()
                        .includes(value)

                    ||

                    (m.status || "")
                        .toLowerCase()
                        .includes(value)

                );

            });


        renderMessages(filtered);

    });

}


// ==========================================
// TOGGLE SINGLE MESSAGE
// ==========================================

function toggleMessage(id, checked) {

    if (checked) {

        if (!selectedMessages.includes(id)) {

            selectedMessages.push(id);

        }

    } else {

        selectedMessages =
            selectedMessages.filter(
                x => x !== id
            );

    }


    updateSelectionState();

}


// ==========================================
// SELECT ALL BUTTON
// ==========================================

const selectAllBtn =
    document.getElementById("selectAllBtn");


if (selectAllBtn) {

    selectAllBtn.onclick = () => {

        const checks =
            document.querySelectorAll(".message-check");


        selectedMessages = [];

        allSelected = !allSelected;


        checks.forEach((checkbox) => {

            checkbox.checked = allSelected;


            if (allSelected) {

                selectedMessages.push(
                    checkbox.value
                );

            }

        });


        updateSelectionButton();

        updateMasterCheckbox();

    };

}


// ==========================================
// MASTER CHECKBOX
// ==========================================

const masterCheck =
    document.getElementById("masterCheck");


if (masterCheck) {

    masterCheck.addEventListener("change", () => {

        const checks =
            document.querySelectorAll(".message-check");


        selectedMessages = [];

        allSelected = masterCheck.checked;


        checks.forEach((checkbox) => {

            checkbox.checked =
                allSelected;


            if (allSelected) {

                selectedMessages.push(
                    checkbox.value
                );

            }

        });


        updateSelectionButton();

    });

}


// ==========================================
// UPDATE SELECTION STATE
// ==========================================

function updateSelectionState() {

    const checks =
        document.querySelectorAll(".message-check");


    allSelected =
        checks.length > 0 &&
        selectedMessages.length === checks.length;


    updateSelectionButton();

    updateMasterCheckbox();

}


// ==========================================
// UPDATE SELECT BUTTON
// ==========================================

function updateSelectionButton() {

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

function updateMasterCheckbox() {

    const master =
        document.getElementById("masterCheck");


    const checks =
        document.querySelectorAll(".message-check");


    if (!master) return;


    master.checked =
        checks.length > 0 &&
        selectedMessages.length === checks.length;

}


// ==========================================
// DELETE SINGLE MESSAGE
// ==========================================

function deleteMessage(id) {

    if (!confirm("Delete this message?")) {

        return;

    }


    db.collection("contactMessages")
        .doc(id)
        .delete()
        .then(() => {

            allMessages =
                allMessages.filter(
                    message => message.id !== id
                );


            selectedMessages =
                selectedMessages.filter(
                    messageId => messageId !== id
                );


            renderMessages(allMessages);

        })
        .catch((error) => {

            console.error(
                "Delete message error:",
                error
            );

            alert(
                "❌ Delete Failed!\n\n" +
                error.message
            );

        });

}


// ==========================================
// DELETE SELECTED
// ==========================================

const deleteSelectedBtn =
    document.getElementById("deleteSelectedBtn");


if (deleteSelectedBtn) {

    deleteSelectedBtn.onclick = async () => {

        if (selectedMessages.length === 0) {

            alert("Select messages first.");

            return;

        }


        if (
            !confirm(
                `Delete ${selectedMessages.length} selected message(s)?`
            )
        ) {

            return;

        }


        const batch = db.batch();


        selectedMessages.forEach((id) => {

            batch.delete(
                db.collection("contactMessages").doc(id)
            );

        });


        try {

            await batch.commit();


            const deletedIds =
                new Set(selectedMessages);


            allMessages =
                allMessages.filter(
                    message =>
                        !deletedIds.has(message.id)
                );


            selectedMessages = [];

            allSelected = false;


            renderMessages(allMessages);


        } catch (error) {

            console.error(
                "Bulk delete error:",
                error
            );

            alert(
                "❌ Failed to delete selected messages.\n\n" +
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