let allMessages = [];
let selectedMessages = [];
let allSelected = false;

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

    allSelected = false;

selectedMessages = [];

const btn = document.getElementById("selectAllBtn");

if(btn){

    btn.innerHTML =
    `<i class="fa-solid fa-check-double"></i> Select All`;

}

    const table = document.getElementById("messageTable");

    table.innerHTML = "";

    list.forEach((m) => {

        table.innerHTML += `

        <tr>

    <td>

        <input
        type="checkbox"
        class="message-check"
        value="${m.id}"
        onchange="toggleMessage('${m.id}',this.checked)">

    </td>

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

function toggleMessage(id, checked){

    if(checked){

        if(!selectedMessages.includes(id)){

            selectedMessages.push(id);

        }

    }

    else{

        selectedMessages =
            selectedMessages.filter(x=>x!==id);

    }

}


document.getElementById("selectAllBtn").onclick = () => {

    const checks = document.querySelectorAll(".message-check");

    selectedMessages = [];

    allSelected = !allSelected;

    checks.forEach(c => {

        c.checked = allSelected;

        if (allSelected) {

            selectedMessages.push(c.value);

        }

    });

    document.getElementById("selectAllBtn").innerHTML = allSelected

        ? `<i class="fa-solid fa-square-minus"></i> Unselect All`

        : `<i class="fa-solid fa-check-double"></i> Select All`;

};
document.getElementById("deleteSelectedBtn").onclick=async()=>{

    if(selectedMessages.length===0){

        alert("Select messages first.");

        return;

    }

    if(!confirm(`Delete ${selectedMessages.length} selected message(s)?`)){

        return;

    }

    const batch=db.batch();

    selectedMessages.forEach(id=>{

        batch.delete(

            db.collection("contactMessages").doc(id)

        );

    });

    try{

    await batch.commit();

    alert("✅ Selected messages deleted.");

    location.reload();

}
catch(err){

    console.error(err);

    alert("❌ Failed to delete messages.");

}

};