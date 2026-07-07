document.getElementById("saveTournament").addEventListener("click", () => {

    const tournament = {

        title: document.getElementById("title").value.trim(),
        game: document.getElementById("game").value.trim(),
        mode: document.getElementById("mode").value.trim(),
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        prize: document.getElementById("prize").value.trim(),
        status: document.getElementById("status").value.trim(),
        registration: document.getElementById("registration").value.trim()

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

    .then(() => {

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