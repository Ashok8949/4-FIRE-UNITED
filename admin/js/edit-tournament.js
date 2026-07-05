const params = new URLSearchParams(window.location.search);
const tournamentId = params.get("id");

if (!tournamentId) {
    alert("Tournament ID Missing!");
    window.location.href = "tournaments.html";
}

const docRef = db.collection("tournaments").doc(tournamentId);

// Load Tournament Data
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

})
.catch((err) => {

    console.error(err);

});

// Update Tournament
document.getElementById("updateTournament").addEventListener("click", () => {

    const data = {

        title: document.getElementById("title").value.trim(),
        game: document.getElementById("game").value.trim(),
        mode: document.getElementById("mode").value.trim(),
        date: document.getElementById("date").value.trim(),
        time: document.getElementById("time").value.trim(),
        prize: document.getElementById("prize").value.trim(),
        status: document.getElementById("status").value.trim(),
        registration: document.getElementById("registration").value.trim()

    };

    docRef.update(data)
    .then(() => {

        alert("✅ Tournament Updated Successfully!");

        window.location.href = "tournaments.html";

    })
    .catch((err) => {

        console.error(err);

        alert("❌ Update Failed!");

    });

});