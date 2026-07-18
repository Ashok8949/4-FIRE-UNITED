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

            <div class="tournament-buttons">

                ${
                    t.registration
                    ? `<a href="${t.registration}" target="_blank" class="register-btn">
                        📝 Register Now
                       </a>`
                    : ""
                }

                ${
                    t.liveLink
                    ? `<a href="${t.liveLink}" target="_blank" class="live-btn">
                        🔴 Watch Live
                       </a>`
                    : ""
                }

            </div>

        </div>

        `;

    });

})
.catch((error) => {

    console.error("Tournament Error:", error);

});