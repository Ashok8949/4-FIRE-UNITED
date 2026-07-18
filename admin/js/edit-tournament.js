const params = new URLSearchParams(window.location.search);
const tournamentId = params.get("id");

if (!tournamentId) {

    alert("Tournament ID Missing!");
    window.location.href = "tournaments.html";

}

const docRef = db.collection("tournaments").doc(tournamentId);

// =========================
// Load Tournament
// =========================

docRef.get()

.then((doc) => {

    if (!doc.exists) {

        alert("Tournament Not Found!");
        window.location.href = "tournaments.html";
        return;

    }

    const t = doc.data();

    document.getElementById("title").value = t.title || "";
    document.getElementById("game").value = t.game || "";
    document.getElementById("mode").value = t.mode || "";
    document.getElementById("date").value = t.date || "";
    document.getElementById("time").value = t.time || "";
    document.getElementById("prize").value = t.prize || "";
    document.getElementById("status").value = t.status || "";
    document.getElementById("registration").value = t.registration || "";
    document.getElementById("liveLink").value = t.liveLink || "";
document.getElementById("liveStatus").value = t.liveStatus || "Upcoming";

})

.catch((err) => {

    console.error(err);

    alert("Failed to load Tournament.");

});

// =========================
// Update Tournament
// =========================

document.getElementById("updateTournament").addEventListener("click", () => {

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
    liveStatus: document.getElementById("liveStatus").value

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

    const btn = document.getElementById("updateTournament");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

    docRef.update(tournament)

    .then(() => {

        alert("✅ Tournament Updated Successfully!");

        window.location.href = "tournaments.html";

    })

    .catch((err) => {

        console.error(err);

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Update Tournament';

        alert("❌ Update Failed!");

    });

});