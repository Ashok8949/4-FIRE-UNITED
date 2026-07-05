document.getElementById("saveTournament").addEventListener("click", () => {

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

    if (!data.title) {
        alert("Please enter Tournament Title.");
        return;
    }

    db.collection("tournaments")
        .add(data)
        .then(() => {

            alert("✅ Tournament Added Successfully!");

            window.location.href = "tournaments.html";

        })
        .catch((error) => {

            console.error(error);
            alert("❌ Failed to add tournament.");

        });

});