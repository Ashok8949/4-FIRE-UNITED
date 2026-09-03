// =========================
// Android FCM Notification
// =========================

const FOUR_FU_ANDROID_FCM_URL =
    "https://script.google.com/macros/s/AKfycbyazs42LLtr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec";

function send4FUTournamentNotification(tournament) {

    try {

        fetch(FOUR_FU_ANDROID_FCM_URL, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify({

                type: "major",

                updateType: "tournament",

                priority: "normal",

                title: "🏆 New Tournament Added",

                body:
                    tournament.title +
                    " has been added to 4 FIRE UNITED.",

                link: "/tournaments.html",

                targetPlayerId: "ALL",

                senderEmail:
                    auth.currentUser?.email || "Admin"

            })

        }).catch((error) => {

            console.warn(
                "4FU ANDROID FCM TOURNAMENT ERROR:",
                error
            );

        });

    } catch (error) {

        console.warn(
            "4FU ANDROID FCM TOURNAMENT ERROR:",
            error
        );

    }

}


// =========================
// Save Tournament
// =========================

document.getElementById("saveTournament").addEventListener("click", () => {

    const tournament = {

        title: document.getElementById("title").value.trim(),
        game: document.getElementById("game").value.trim(),
        mode: document.getElementById("mode").value.trim(),
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        prize: document.getElementById("prize").value.trim(),
        status: document.getElementById("status").value.trim(),
        registration: document.getElementById("registration").value.trim(),
        liveLink: document.getElementById("liveLink").value.trim(),
        liveStatus: document.getElementById("liveStatus").value,

    };

    if (
        !tournament.title ||
        !tournament.game ||
        !tournament.mode ||
        !tournament.date ||
        !tournament.time
    ) {

        alert("Please fill all required fields.");
        return;

    }

    const btn = document.getElementById("saveTournament");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    db.collection("tournaments")
    .add(tournament)

    .then(async () => {

        await db.collection("notifications").add({

            title: "New Tournament Added",

            message: tournament.title,

            type: "tournament",

            link: "tournaments.html",

            isRead: false,

            createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });


        // =========================
        // Send Android Notification
        // =========================

        send4FUTournamentNotification(tournament);


        alert("✅ Tournament Added Successfully!");

        window.location.href = "tournaments.html";

    })

    .catch((error) => {

        console.error(error);

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Tournament';

        alert("❌ Failed to add Tournament.");

    });

});