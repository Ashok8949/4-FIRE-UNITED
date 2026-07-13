document.addEventListener("homeDataReady", () => {

    // ===============================
    // Latest Announcement
    // ===============================

    const announcementBox = document.getElementById("announcement-box");

    if (announcementBox) {

        if (window.homeData.announcement.empty) {

            announcementBox.innerHTML = `
                <div class="announcement-card">
                    <h3>No Announcement</h3>
                    <p>No latest announcements available.</p>
                </div>
            `;

        } else {

            const a = window.homeData.announcement.docs[0].data();

            announcementBox.innerHTML = `
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
        }

    }

    // ===============================
    // Featured Tournament
    // ===============================

    const tournamentBox = document.getElementById("featuredTournament");

    if (tournamentBox) {

        if (window.homeData.tournament.empty) {

            tournamentBox.innerHTML = `
                <div class="announcement-card">
                    <h3>No Tournament Available</h3>
                    <p>No tournament found.</p>
                </div>
            `;

        } else {

            const t = window.homeData.tournament.docs[0].data();

            tournamentBox.innerHTML = `
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

        }

    }

    // ===============================
    // Statistics
    // ===============================

    document.getElementById("totalPlayers").textContent =
        window.homeData.players.size;

    document.getElementById("totalTournaments").textContent =
        window.homeData.allTournaments.size;

    document.getElementById("totalGallery").textContent =
        window.homeData.gallery.size;

    if (window.homeData.visitors.exists) {

        document.getElementById("totalVisitors").textContent =
            window.homeData.visitors.data().total || 0;

    }

});