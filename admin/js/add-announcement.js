// =========================
// Android FCM Notification
// =========================

const FOUR_FU_ANDROID_FCM_URL =
    "https://script.google.com/macros/s/AKfycbyazs42LLtr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec";

function send4FUAnnouncementNotification(announcement) {

    try {

        fetch(FOUR_FU_ANDROID_FCM_URL, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify({

                type: "major",

                updateType: "announcement",

                priority: "normal",

                title: "📢 New Announcement",

                body:
                    announcement.title +
                    " has been added to 4 FIRE UNITED.",

                link: "/announcements.html",

                targetPlayerId: "ALL",

                senderEmail:
                    auth.currentUser?.email || "Admin"

            })

        }).catch((error) => {

            console.warn(
                "4FU ANDROID FCM ANNOUNCEMENT ERROR:",
                error
            );

        });

    } catch (error) {

        console.warn(
            "4FU ANDROID FCM ANNOUNCEMENT ERROR:",
            error
        );

    }

}


// =========================
// Save Announcement
// =========================

document.getElementById("saveAnnouncement").addEventListener("click", () => {

    const announcement = {

        title: document.getElementById("title").value.trim(),
        category: document.getElementById("category").value.trim(),
        date: document.getElementById("date").value,
        status: document.getElementById("status").value.trim(),
        description: document.getElementById("description").value.trim()

    };

    if (
        !announcement.title ||
        !announcement.category ||
        !announcement.date
    ) {

        alert("Please fill all required fields.");
        return;

    }

    const btn = document.getElementById("saveAnnouncement");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    db.collection("announcements")
    .add(announcement)

    .then(async () => {

        await db.collection("notifications").add({

            title: "New Announcement",

            message: announcement.title,

            type: "announcement",

            link: "announcements.html",

            isRead: false,

            createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });


        // =========================
        // Send Android Notification
        // =========================

        send4FUAnnouncementNotification(announcement);


        alert("✅ Announcement Added Successfully!");

        window.location.href = "announcements.html";

    })

    .catch((err) => {

        console.error(err);

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Announcement';

        alert("❌ Failed to save announcement.");

    });

});