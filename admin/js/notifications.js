const bell = document.getElementById("notificationBell");
const dropdown = document.getElementById("notificationDropdown");
const list = document.getElementById("notificationList");
const count = document.getElementById("notificationCount");
const clearReadBtn = document.getElementById("clearReadBtn");


// =====================================
// NOTIFICATION SOUND
// =====================================

const notificationAudio = new Audio("sounds/notification.mp3");

notificationAudio.preload = "auto";


// =====================================
// NOTIFICATIONS ARRAY
// =====================================

let notifications = [];


// =====================================
// PLAY NOTIFICATION SOUND
// =====================================

function playNotificationSound() {

    console.log("🔔 Sound Called");

    notificationAudio.currentTime = 0;

    notificationAudio.play()
        .then(() => console.log("✅ Sound Playing"))
        .catch(err => console.error("❌", err));

}


// =====================================
// NOTIFICATION BELL
// =====================================

bell.onclick = () => {

    dropdown.style.display =
        dropdown.style.display === "block"
            ? "none"
            : "block";

};


// =====================================
// CLOSE DROPDOWN
// =====================================

window.addEventListener("click", (e) => {

    if (!e.target.closest(".notification")) {

        dropdown.style.display = "none";

    }

});


// =====================================
// RENDER NOTIFICATIONS
// =====================================

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


// =====================================
// FIRST SNAPSHOT
// =====================================

let firstSnapshot = true;


// =====================================
// FIRESTORE NOTIFICATIONS
// =====================================

db.collection("notifications")
.orderBy("createdAt", "desc")
.limit(20)
.onSnapshot((snapshot) => {

    notifications = [];


    snapshot.docChanges().forEach((change) => {

        if (!firstSnapshot && change.type === "added") {

            const data = change.doc.data();


            // =====================================
            // PLAY SOUND ONLY
            // =====================================
            // Browser push notification removed.
            // Android app FCM notifications are handled
            // separately by the Android app.

            playNotificationSound();

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


// =====================================
// OPEN NOTIFICATION
// =====================================

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


// =====================================
// CLEAR READ NOTIFICATIONS
// =====================================

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