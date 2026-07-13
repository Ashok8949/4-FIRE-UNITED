let notifications = [];
const container = document.getElementById("allNotifications");

db.collection("notifications")
.orderBy("createdAt", "desc")
.onSnapshot((snapshot) => {

    container.innerHTML = "";

    if (snapshot.empty) {

        container.innerHTML = `
            <div class="dashboard-section">
                <h2>No Notifications</h2>
            </div>
        `;

        return;

    }

    snapshot.forEach((doc) => {

    notifications.push({

        id: doc.id,

        ...doc.data()

    });

});

renderNotifications();

});

const searchBox = document.getElementById("notificationSearch");
const filterBox = document.getElementById("notificationFilter");

searchBox.addEventListener("input", renderNotifications);
filterBox.addEventListener("change", renderNotifications);

document.getElementById("markAllRead").onclick = async () => {

    const snapshot = await db.collection("notifications")
        .where("isRead", "==", false)
        .get();

    if (snapshot.empty) {

        alert("No unread notifications.");

        return;

    }

    const batch = db.batch();

    snapshot.forEach(doc => {

        batch.update(doc.ref, {

            isRead: true

        });

    });

    await batch.commit();

};

function renderNotifications() {

    container.innerHTML = "";

    const search =
        searchBox.value.toLowerCase();

    const filter =
        filterBox.value;

    let filtered = notifications.filter(item => {

        const matchSearch =

            item.title.toLowerCase().includes(search) ||

            item.message.toLowerCase().includes(search);

        let matchFilter = true;

        if (filter === "read") {

            matchFilter = item.isRead;

        }

        if (filter === "unread") {

            matchFilter = !item.isRead;

        }

        return matchSearch && matchFilter;

    });

    if (filtered.length === 0) {

        container.innerHTML = `

        <div class="dashboard-section">

            <h2>No Notifications Found</h2>

        </div>

        `;

        return;

    }

    filtered.forEach((n) => {

        container.innerHTML += `

        <div class="dashboard-section">

            <div class="activity-item ${n.isRead ? "" : "unread"}">

                <i class="fa-solid fa-bell"></i>

                <div style="flex:1">

                    <h4>${n.title}</h4>

                    <p>${n.message}</p>

                </div>

                <button
    class="notification-open-btn"
    onclick="window.location='${n.link}'">

    <i class="fa-solid fa-arrow-up-right-from-square"></i>

    Open

</button>

            </div>

        </div>

        `;

    });

}