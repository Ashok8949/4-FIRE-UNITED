// ===============================
// LATEST ANNOUNCEMENT
// ===============================

db.collection("announcements")
.orderBy("date", "desc")
.limit(1)
.get()

.then((snapshot) => {

    const box = document.getElementById("announcement-box");

    if (!box) return;

    if (snapshot.empty) {

        box.innerHTML = `

        <div class="announcement-card">

            <h3>No Announcement</h3>

            <p>No latest announcements available.</p>

        </div>

        `;

        return;

    }

    snapshot.forEach((doc) => {

        const a = doc.data();

        box.innerHTML = `

        <div class="announcement-card">

            <h3>${a.title}</h3>

            <p>${a.description}</p>

            <div class="announcement-meta">

                <span>
                    <i class="fa-solid fa-tag"></i>
                    ${a.category}
                </span>

                <span>
                    <i class="fa-solid fa-calendar"></i>
                    ${a.date}
                </span>

                <span>
                    <i class="fa-solid fa-circle-check"></i>
                    ${a.status}
                </span>

            </div>

        </div>

        `;

    });

})

.catch((err) => {

    console.error(err);

});


// ===============================
// FEATURED TOURNAMENT
// ===============================

db.collection("tournaments")
.orderBy("date", "desc")
.limit(1)
.get()

.then((snapshot) => {

    const box = document.getElementById("featuredTournament");

    if (!box) return;

    if (snapshot.empty) {

        box.innerHTML = `

        <div class="announcement-card">

            <h3>No Tournament Available</h3>

            <p>No tournament found.</p>

        </div>

        `;

        return;

    }

    snapshot.forEach((doc) => {

        const t = doc.data();

        box.innerHTML = `

        <div class="announcement-card">

            <h3>${t.title}</h3>

            <p>

                <strong>🎮 Game:</strong> ${t.game}<br>
                <strong>👥 Mode:</strong> ${t.mode}<br>
                <strong>🏆 Prize:</strong> ${t.prize}

            </p>

            <div class="announcement-meta">

                <span>
                    <i class="fa-solid fa-calendar"></i>
                    ${t.date}
                </span>

                <span>
                    <i class="fa-solid fa-clock"></i>
                    ${t.time}
                </span>

                <span>
                    <i class="fa-solid fa-circle-check"></i>
                    ${t.status}
                </span>

            </div>

        </div>

        `;

    });

})

.catch((err) => {

    console.error(err);

});
// ===============================
// LIVE STATISTICS
// ===============================

// Players
db.collection("players")
.get()
.then((snapshot) => {

    document.getElementById("totalPlayers").textContent =
        snapshot.size;

});

// Tournaments
db.collection("tournaments")
.get()
.then((snapshot) => {

    document.getElementById("totalTournaments").textContent =
        snapshot.size;

});

// Gallery
db.collection("gallery")
.get()
.then((snapshot) => {

    document.getElementById("totalGallery").textContent =
        snapshot.size;

});

// Visitors
db.collection("stats")
.doc("visitors")
.get()
.then((doc) => {

    if (doc.exists) {

        document.getElementById("totalVisitors").textContent =
            doc.data().total || 0;

    }

});