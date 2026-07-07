db.collection("tournaments")
.get()
.then((snapshot) => {

    const grid = document.getElementById("tournament-grid");

    grid.innerHTML = "";

    snapshot.forEach((doc) => {

        const t = doc.data();

        grid.innerHTML += `

        <div class="tournament-card">

            <h2>${t.title}</h2>

            <p><strong>Game:</strong> ${t.game}</p>

            <p><strong>Mode:</strong> ${t.mode}</p>

            <p><strong>Date:</strong> ${t.date}</p>

            <p><strong>Time:</strong> ${t.time}</p>

            <p><strong>Prize:</strong> ${t.prize}</p>

            <span>${t.status}</span>

        </div>

        `;

    });

})
.catch((error) => {

    console.error("Tournament Error:", error);

});