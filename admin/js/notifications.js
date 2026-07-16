const bell = document.getElementById("notificationBell");
const dropdown = document.getElementById("notificationDropdown");
const list = document.getElementById("notificationList");
const count = document.getElementById("notificationCount");
const clearReadBtn = document.getElementById("clearReadBtn");

const notificationAudio = new Audio("sounds/notification.mp3");
if ("Notification" in window &&
    Notification.permission !== "granted") {

    Notification.requestPermission();

}
notificationAudio.preload = "auto";

function showBrowserNotification(title, message) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(title, {

            body: message,

            icon: "../images/logo/logo.png"

        });

    }

}

let notifications = [];


function playNotificationSound() {

    console.log("🔔 Sound Called");

    notificationAudio.currentTime = 0;

    notificationAudio.play()
        .then(() => console.log("✅ Sound Playing"))
        .catch(err => console.error("❌", err));

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
let firstSnapshot = true;


db.collection("notifications")
.orderBy("createdAt", "desc")
.limit(20)
.onSnapshot((snapshot) => {

    notifications = [];

    snapshot.docChanges().forEach((change) => {

        if (!firstSnapshot && change.type === "added") {

            const data = change.doc.data();

            playNotificationSound();

            showBrowserNotification(

                data.title || "Notification",

                data.message || ""

            );

        }

    });

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

    firstSnapshot = false;

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