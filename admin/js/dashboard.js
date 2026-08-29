// =====================================
// LOGOUT
// =====================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        auth.signOut()
            .then(() => {

                window.location.href = "login.html";

            })
            .catch((err) => {

                console.error(err);

                alert(err.message);

            });

    });

}

// =====================================
// COUNT FUNCTION
// =====================================

function loadCount(collection, elementId) {

    db.collection(collection)
        .get()
        .then((snapshot) => {

            const el = document.getElementById(elementId);

            if (el) {

                el.textContent = snapshot.size;

            }

        })
        .catch(console.error);

}

// =====================================
// LIVE COUNTS
// =====================================

loadCount("players", "totalPlayers");
loadCount("tournaments", "totalTournaments");
loadCount("gallery", "totalGallery");
loadCount("contactMessages", "totalMessages");
loadCount("joinApplications", "totalApplications");

// Visitors

db.collection("stats")
    .doc("visitors")
    .get()

    .then((doc) => {

        const el = document.getElementById("totalVisitors");

        if (!el) return;

        if (doc.exists) {

            el.textContent = doc.data().total || 0;

        } else {

            el.textContent = 0;

        }

    });

// =====================================
// QUICK ACTIONS
// =====================================

function quickAction(id, page) {

    const btn = document.getElementById(id);

    if (!btn) return;

    btn.style.cursor = "pointer";

    btn.onclick = () => {

        window.location.href = page;

    };

}

quickAction("managePlayers", "players.html");
quickAction("manageTournament", "tournaments.html");
quickAction("manageGallery", "gallery.html");
quickAction("manageClips", "clips.html");
quickAction("manageNews", "announcements.html");
quickAction("manageMessages", "messages.html");
quickAction("manageApplications", "applications.html");
quickAction("manageSettings", "settings.html");

// =====================================
// RECENT PLAYER
// =====================================

db.collection("players")
    .limit(1)
    .get()

    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const p = doc.data();

            const el = document.getElementById("latestPlayer");

            if (el) {

                el.textContent = p.name + " (" + p.role + ")";

            }

        });

    });

// =====================================
// RECENT TOURNAMENT
// =====================================

db.collection("tournaments")
    .limit(1)
    .get()

    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const t = doc.data();

            const el = document.getElementById("latestTournament");

            if (el) {

                el.textContent = t.title;

            }

        });

    });

// =====================================
// RECENT MESSAGE
// =====================================

db.collection("contactMessages")
    .limit(1)
    .get()

    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const m = doc.data();

            const el = document.getElementById("latestMessage");

            if (el) {

                el.textContent = m.name + " • " + m.subject;

            }

        });

    });

// =====================================
// RECENT APPLICATION
// =====================================

db.collection("joinApplications")
    .limit(1)
    .get()

    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const a = doc.data();

            const el = document.getElementById("latestApplication");

            if (el) {

                el.textContent = a.name + " • " + a.rank;

            }

        });

    });

document
    .getElementById("sendNotification")
    ?.addEventListener("click", () => {

        window.location.href =
            "notifications.html";

    });

// ============================================
// SEND PUSH NOTIFICATION
// ============================================

const sendNotificationBtn =
    document.getElementById("sendNotificationBtn");

if (sendNotificationBtn) {

    sendNotificationBtn.addEventListener("click", async () => {

        const title =
            document.getElementById("notificationTitle")
                .value
                .trim();

        const message =
            document.getElementById("notificationMessage")
                .value
                .trim();

        const target =
            document.getElementById("notificationTarget")
                .value;

        const link =
            document.getElementById("notificationLink")
                .value
                .trim() ||
            "/player-dashboard.html";


        if (!title || !message) {

            alert(
                "Please enter notification title and message."
            );

            return;
        }


        try {

            sendNotificationBtn.disabled = true;

            sendNotificationBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';


            // ========================================
            // 1. SAVE NOTIFICATION IN FIRESTORE
            // ========================================

            await db.collection("notifications").add({

                title: title,

                message: message,

                target: target,

                link: link,

                type: "push",

                isRead: false,

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });


            // ========================================
            // 2. SEND PUSH NOTIFICATION
            // ========================================

            const response = await fetch(
                "https://script.google.com/macros/s/AKfycbxUZlmL3-7t3MfrUONl1igu_3G2w8HwI6sUshCy_Smci5CklflchRRTe34SD1IO33o/exec",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body: JSON.stringify({

                        title: title,

                        body: message,

                        link: link

                    })

                }
            );


            const result =
                await response.json();




            console.log(
                "FCM Response:",
                result
            );


            if (!result.success) {

                throw new Error(
                    result.error ||
                    "Notification sending failed."
                );

            }

            // ========================================
            // SAVE NOTIFICATION FOR PLAYER DASHBOARD
            // ========================================

            await db.collection("notifications").add({

                title: title,

                message: message,

                target: "ALL",

                link: link,

                type: "push",

                isRead: false,

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });


            // ========================================
            // SUCCESS
            // ========================================

            alert(
                "✅ Notification sent successfully!\n\n" +
                "Sent: " +
                result.sent +
                "\nFailed: " +
                result.failed
            );


            // Clear form

            document.getElementById(
                "notificationTitle"
            ).value = "";

            document.getElementById(
                "notificationMessage"
            ).value = "";

            document.getElementById(
                "notificationLink"
            ).value =
                "/player-dashboard.html";


        } catch (error) {

            console.error(
                "❌ Notification Error:",
                error
            );

            alert(
                "❌ Failed to send notification.\n\n" +
                error.message
            );

        } finally {

            sendNotificationBtn.disabled =
                false;

            sendNotificationBtn.innerHTML =
                '<i class="fa-solid fa-paper-plane"></i> Send Notification';

        }

    });

}