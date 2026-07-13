const bell = document.getElementById("notificationBell");
const dropdown = document.getElementById("notificationDropdown");
const list = document.getElementById("notificationList");
const count = document.getElementById("notificationCount");
const clearReadBtn = document.getElementById("clearReadBtn");

const notificationAudio = new Audio("sounds/notification.mp3");
notificationAudio.preload = "auto";

let notifications = [];
let lastUnreadCount = 0;

function playNotificationSound() {

    notificationAudio.currentTime = 0;

    notificationAudio.play().catch(() => {});

}

bell.onclick = () => {

    dropdown.style.display =
        dropdown.style.display === "block"
            ? "none"
            : "block";

};

window.addEventListener("click", (e) => {

    if (!e.target.closest(".notification")) {

        dropdown.style.display = "none";

    }

});

function renderNotifications() {

    list.innerHTML = "";

    if (notifications.length === 0) {

        list.innerHTML = `
            <p class="empty-notification">
                No Notifications
            </p>
        `;

        count.style.display = "none";

        return;

    }

    const unreadCount =
        notifications.filter(n => !n.isRead).length;

    if (
        unreadCount > lastUnreadCount &&
        lastUnreadCount !== 0
    ) {

        playNotificationSound();

    }

    lastUnreadCount = unreadCount;

    if (unreadCount > 0) {

        count.style.display = "flex";

        count.textContent = unreadCount;

    } else {

        count.style.display = "none";

    }

    notifications.forEach(item => {

        list.innerHTML += `

        <div class="notification-item ${item.isRead ? "" : "unread"}"

        onclick="openNotification('${item.id}','${item.link}')">

            <h4>${item.title}</h4>

            <p>${item.message}</p>

        </div>

        `;

    });

}

db.collection("notifications")
.orderBy("createdAt", "desc")
.limit(20)
.onSnapshot((snapshot) => {

    notifications = [];

    snapshot.forEach((doc) => {

        const data = doc.data();

        notifications.push({

            id: doc.id,

            title: data.title || "Notification",

            message: data.message || "",

            link: data.link || "#",

            isRead: data.isRead || false,

            createdAt: data.createdAt || null

        });

    });

    renderNotifications();

});

async function openNotification(id, link) {

    try {

        await db.collection("notifications")
        .doc(id)
        .update({

            isRead: true

        });

    } catch (err) {

        console.error(err);

    }

    if (link && link !== "#") {

        window.location.href = link;

    }

}

clearReadBtn.addEventListener("click", async () => {

    try {

        const snapshot = await db.collection("notifications")
        .where("isRead", "==", true)
        .get();

        if (snapshot.empty) {

            alert("No read notifications found.");

            return;

        }

        const batch = db.batch();

        snapshot.forEach((doc) => {

            batch.delete(doc.ref);

        });

        await batch.commit();

        alert("Read notifications cleared.");

    } catch (err) {

        console.error(err);

        alert("Failed to clear notifications.");

    }

});