// =====================================
// LOGOUT
// =====================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {

        auth.signOut()
            .then(() => {
                window.location.href = "login.html";
            })
            .catch((err) => {
                console.error(err);
                alert(err.message);
            });

    });
}


// =====================================
// COUNT FUNCTION
// =====================================

function loadCount(collection, elementId) {

    db.collection(collection)
        .get()
        .then((snapshot) => {

            const el = document.getElementById(elementId);

            if (el) {
                el.textContent = snapshot.size;
            }

        })
        .catch(console.error);
}


// =====================================
// LIVE COUNTS
// =====================================

loadCount("players", "totalPlayers");
loadCount("tournaments", "totalTournaments");
loadCount("gallery", "totalGallery");
loadCount("contactMessages", "totalMessages");
loadCount("joinApplications", "totalApplications");
loadCount("challengeRegistrations", "totalChallenges");


// =====================================
// VISITORS
// =====================================

db.collection("stats")
    .doc("visitors")
    .get()
    .then((doc) => {

        const el = document.getElementById("totalVisitors");

        if (!el) return;

        if (doc.exists) {
            el.textContent = doc.data().total || 0;
        } else {
            el.textContent = 0;
        }

    })
    .catch(console.error);


// =====================================
// QUICK ACTIONS
// =====================================

function quickAction(id, page) {

    const btn = document.getElementById(id);

    if (!btn) return;

    btn.style.cursor = "pointer";

    btn.onclick = () => {
        window.location.href = page;
    };

}


quickAction("managePlayers", "players.html");
quickAction("manageTournament", "tournaments.html");
quickAction("manageGallery", "gallery.html");
quickAction("manageClips", "clips.html");
quickAction("manageNews", "announcements.html");
quickAction("manageMessages", "messages.html");
quickAction("manageApplications", "applications.html");
quickAction("manageChallenges", "challenge-registrations.html");
quickAction("manageSettings", "settings.html");


// =====================================
// RECENT PLAYER
// =====================================

db.collection("players")
    .limit(1)
    .get()
    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const p = doc.data();

            const el = document.getElementById("latestPlayer");

            if (el) {
                el.textContent =
                    p.name + " (" + p.role + ")";
            }

        });

    })
    .catch(console.error);


// =====================================
// RECENT TOURNAMENT
// =====================================

db.collection("tournaments")
    .limit(1)
    .get()
    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const t = doc.data();

            const el =
                document.getElementById("latestTournament");

            if (el) {
                el.textContent = t.title;
            }

        });

    })
    .catch(console.error);


// =====================================
// RECENT MESSAGE
// =====================================

db.collection("contactMessages")
    .limit(1)
    .get()
    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const m = doc.data();

            const el =
                document.getElementById("latestMessage");

            if (el) {
                el.textContent =
                    m.name + " • " + m.subject;
            }

        });

    })
    .catch(console.error);


// =====================================
// RECENT APPLICATION
// =====================================

db.collection("joinApplications")
    .limit(1)
    .get()
    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const a = doc.data();

            const el =
                document.getElementById("latestApplication");

            if (el) {
                el.textContent =
                    a.name + " • " + a.rank;
            }

        });

    })
    .catch(console.error);


// =====================================
// NOTIFICATIONS PAGE
// =====================================

document
    .getElementById("sendNotification")
    ?.addEventListener("click", () => {

        window.location.href =
            "notifications.html";

    });


// ============================================
// SEND PUSH NOTIFICATION
// ============================================

const sendNotificationBtn =
    document.getElementById("sendNotificationBtn");


if (sendNotificationBtn) {

    sendNotificationBtn.addEventListener(
        "click",
        async () => {

            const title =
                document
                    .getElementById("notificationTitle")
                    .value
                    .trim();

            const message =
                document
                    .getElementById("notificationMessage")
                    .value
                    .trim();

            const target =
                document
                    .getElementById("notificationTarget")
                    .value;

            const link =
                document
                    .getElementById("notificationLink")
                    .value
                    .trim() ||
                "/player-dashboard.html";


            if (!title || !message) {

                alert(
                    "Please enter notification title and message."
                );

                return;
            }


            try {

                sendNotificationBtn.disabled = true;

                sendNotificationBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';


                // ========================================
                // SAVE NOTIFICATION
                // ========================================

                await db
                    .collection("notifications")
                    .add({

                        title: title,

                        message: message,

                        target: target,

                        link: link,

                        type: "push",

                        isRead: false,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });


                // ========================================
                // SEND ANDROID APP ADMIN PUSH
                // ========================================

                const response =
                    await fetch(
                        "https://script.google.com/macros/s/AKfycbyazs42LLtr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "text/plain;charset=utf-8"
                            },

                            body: JSON.stringify({

                                type: "admin",

                                priority: "high",

                                title: title,

                                body: message,

                                link: link,

                                targetPlayerId: "ALL",

                                senderEmail:
                                    auth.currentUser?.email ||
                                    "Admin"

                            })

                        }
                    );


                const result =
                    await response.json();


                console.log(
                    "FCM Response:",
                    result
                );


                if (!result.success) {

                    throw new Error(
                        result.error ||
                        "Notification sending failed."
                    );

                }


                // ========================================
                // SAVE PLAYER DASHBOARD NOTIFICATION
                // ========================================

                await db
                    .collection("notifications")
                    .add({

                        title: title,

                        message: message,

                        target: "ALL",

                        link: link,

                        type: "push",

                        isRead: false,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });


                // ========================================
                // SUCCESS
                // ========================================

                alert(
                    "✅ Notification sent successfully!\n\n" +
                    "Sent: " +
                    result.sent +
                    "\nFailed: " +
                    result.failed
                );


                // Clear form

                document
                    .getElementById("notificationTitle")
                    .value = "";

                document
                    .getElementById("notificationMessage")
                    .value = "";

                document
                    .getElementById("notificationLink")
                    .value =
                    "/player-dashboard.html";


            } catch (error) {

                console.error(
                    "❌ Notification Error:",
                    error
                );

                alert(
                    "❌ Failed to send notification.\n\n" +
                    error.message
                );

            } finally {

                sendNotificationBtn.disabled =
                    false;

                sendNotificationBtn.innerHTML =
                    '<i class="fa-solid fa-paper-plane"></i> Send Notification';

            }

        }
    );

}

/* ============================================================
   4FU COMMAND CENTER — CORRECTED ADD-ON
   ============================================================
   IMPORTANT:
   - Existing 4FU dashboard code untouched.
   - Existing notification system untouched.
   - Existing notification code MUST remain above this block.
   - Do NOT load gameplayClips here because admin permission
     is not available for this dashboard.
   ============================================================ */

(() => {
    "use strict";

    /* ========================================================
       HELPERS
       ======================================================== */

    const el = (id) => document.getElementById(id);

    function valueOf(obj, ...keys) {
        for (const key of keys) {
            if (
                obj &&
                obj[key] !== undefined &&
                obj[key] !== null &&
                String(obj[key]).trim() !== ""
            ) {
                return obj[key];
            }
        }

        return "";
    }


    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function timestampValue(timestamp) {

        if (!timestamp) return 0;

        try {

            if (typeof timestamp.toMillis === "function") {
                return timestamp.toMillis();
            }

            if (typeof timestamp.toDate === "function") {
                return timestamp.toDate().getTime();
            }

            if (timestamp.seconds) {
                return timestamp.seconds * 1000;
            }

            const date = new Date(timestamp);

            if (!Number.isNaN(date.getTime())) {
                return date.getTime();
            }

        } catch (error) {
            return 0;
        }

        return 0;
    }


    function timeAgo(timestamp) {

        const time = timestampValue(timestamp);

        if (!time) {
            return "Recently";
        }

        const difference =
            Math.max(0, Date.now() - time);

        const seconds =
            Math.floor(difference / 1000);

        if (seconds < 60) {
            return "Just now";
        }

        const minutes =
            Math.floor(seconds / 60);

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours =
            Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days =
            Math.floor(hours / 24);

        if (days < 30) {
            return `${days}d ago`;
        }

        return new Date(time).toLocaleDateString();
    }


    /* ========================================================
       DATA
       ======================================================== */

    const commandCenterData = {

        players: [],
        tournaments: [],
        applications: [],
        messages: [],
        challenges: [],
        gallery: []

    };


    /* ========================================================
       FIRESTORE LOADER
       ======================================================== */

    async function loadCollection(collectionName) {

        try {

            const snapshot =
                await db
                    .collection(collectionName)
                    .get();

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {

            console.warn(
                `4FU Command Center: ${collectionName} unavailable`,
                error
            );

            return [];
        }
    }


    /* ========================================================
       LOAD DATA
       ======================================================== */

    async function loadCommandCenter() {

        try {

            const results =
                await Promise.all([

                    loadCollection("players"),

                    loadCollection("tournaments"),

                    loadCollection("joinApplications"),

                    loadCollection("contactMessages"),

                    loadCollection(
                        "challengeRegistrations"
                    ),

                    loadCollection("gallery")

                ]);


            commandCenterData.players =
                results[0];

            commandCenterData.tournaments =
                results[1];

            commandCenterData.applications =
                results[2];

            commandCenterData.messages =
                results[3];

            commandCenterData.challenges =
                results[4];

            commandCenterData.gallery =
                results[5];


            renderActionRequired();

            renderProfileHealth();

            renderRecentActivity();

            updateProfileHealthScore();

        } catch (error) {

            console.error(
                "4FU Command Center error:",
                error
            );

        }
    }


    /* ========================================================
       ACTION REQUIRED
       ======================================================== */

    function getPendingApplications() {

        return commandCenterData
            .applications
            .filter((application) => {

                const status =
                    String(
                        application.status || "Pending"
                    ).toLowerCase();

                return (
                    status === "pending" ||
                    status === "new" ||
                    status === "waiting"
                );

            });

    }


    function getNewMessages() {

        return commandCenterData
            .messages
            .filter((message) => {

                const status =
                    String(
                        message.status || "New"
                    ).toLowerCase();

                return (
                    status === "new" ||
                    status === "unread"
                );

            });

    }


    function getNewChallenges() {

        return commandCenterData
            .challenges
            .filter((challenge) => {

                const status =
                    String(
                        challenge.status || "New"
                    ).toLowerCase();

                return (
                    status === "new" ||
                    status === "pending"
                );

            });

    }


    function getIncompletePlayers() {

        return commandCenterData
            .players
            .filter((player) => {

                /*
                 * IMPORTANT:
                 *
                 * Tumhare actual player system me:
                 *
                 * weaponName = Favorite Weapon
                 * weaponImage = Weapon Image
                 *
                 * Bio ko required nahi rakha gaya hai,
                 * kyunki Add/Edit Player form me bio field
                 * available nahi hai.
                 */

                const name =
                    valueOf(
                        player,
                        "name",
                        "username",
                        "playerName"
                    );

                const ign =
                    valueOf(
                        player,
                        "ign"
                    );

                const uid =
                    valueOf(
                        player,
                        "uid"
                    );

                const role =
                    valueOf(
                        player,
                        "role"
                    );

                const image =
                    valueOf(
                        player,
                        "image",
                        "photo",
                        "avatar",
                        "profileImage"
                    );

                const weaponName =
                    valueOf(
                        player,
                        "weaponName"
                    );

                const missing = [];


                if (!name) {
                    missing.push("name");
                }

                if (!ign) {
                    missing.push("IGN");
                }

                if (!uid) {
                    missing.push("UID");
                }

                if (!role) {
                    missing.push("role");
                }

                if (!image) {
                    missing.push("profile image");
                }

                /*
                 * ONLY weaponName is checked.
                 * weaponImage is NOT required because a player
                 * can have a weapon name even if image is missing.
                 */

                if (!weaponName) {
                    missing.push("favorite weapon");
                }


                return missing.length > 0;

            });

    }


    function renderActionRequired() {

        const container =
            el("actionRequiredList");

        const counter =
            el("actionRequiredTotal");


        if (!container) {
            return;
        }


        const pendingApplications =
            getPendingApplications();

        const newMessages =
            getNewMessages();

        const newChallenges =
            getNewChallenges();

        const incompletePlayers =
            getIncompletePlayers();


        const actions = [];


        if (pendingApplications.length) {

            actions.push({

                icon: "fa-file-circle-check",

                title:
                    `${pendingApplications.length} Pending Applications`,

                description:
                    "Join applications waiting for review.",

                button:
                    "Review",

                link:
                    "applications.html"

            });

        }


        if (newMessages.length) {

            actions.push({

                icon: "fa-envelope",

                title:
                    `${newMessages.length} New Messages`,

                description:
                    "New contact messages need attention.",

                button:
                    "Open",

                link:
                    "messages.html"

            });

        }


        if (newChallenges.length) {

            actions.push({

                icon: "fa-bolt",

                title:
                    `${newChallenges.length} New Challenges`,

                description:
                    "Challenge registrations waiting for review.",

                button:
                    "Check",

                link:
                    "challenge-registrations.html"

            });

        }


        if (incompletePlayers.length) {

            actions.push({

                icon: "fa-user-pen",

                title:
                    `${incompletePlayers.length} Incomplete Profiles`,

                description:
                    "Some player information is missing.",

                button:
                    "Check",

                link:
                    "players.html"

            });

        }


        if (counter) {

            counter.textContent =
                actions.length;

        }


        if (!actions.length) {

            container.innerHTML = `

                <div class="cc-action-item">

                    <div class="cc-action-icon">
                        <i class="fa-solid fa-check"></i>
                    </div>

                    <div class="cc-action-info">

                        <strong>
                            All caught up!
                        </strong>

                        <span>
                            There are no pending admin actions.
                        </span>

                    </div>

                </div>

            `;

            return;
        }


        container.innerHTML =
            actions
                .map((action) => {

                    return `

                        <div class="cc-action-item">

                            <div class="cc-action-icon">
                                <i class="fa-solid ${action.icon}"></i>
                            </div>

                            <div class="cc-action-info">

                                <strong>
                                    ${escapeHTML(action.title)}
                                </strong>

                                <span>
                                    ${escapeHTML(action.description)}
                                </span>

                            </div>

                            <button
                                type="button"
                                class="cc-action-btn"
                                data-cc-link="${escapeHTML(action.link)}"
                            >
                                ${escapeHTML(action.button)}
                            </button>

                        </div>

                    `;

                })
                .join("");


        container
            .querySelectorAll("[data-cc-link]")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            button.dataset.ccLink;

                    }
                );

            });

    }


    /* ========================================================
       PROFILE HEALTH
       ======================================================== */

    function renderProfileHealth() {

        const container =
            el("profileHealthList");


        if (!container) {
            return;
        }


        const issues =
            getIncompletePlayers();


        if (!issues.length) {

            container.innerHTML = `

                <div class="health-item">

                    <span class="health-dot ok"></span>

                    <div class="health-info">

                        <strong>
                            All player profiles look good
                        </strong>

                        <span>
                            No required player information is missing.
                        </span>

                    </div>

                </div>

            `;

            return;
        }


        container.innerHTML =
            issues
                .slice(0, 10)
                .map((player) => {

                    const name =
                        valueOf(
                            player,
                            "name",
                            "username",
                            "playerName"
                        ) ||
                        "Unknown Player";


                    const missing = [];


                    if (!valueOf(player, "name", "username", "playerName")) {
                        missing.push("name");
                    }

                    if (!valueOf(player, "ign")) {
                        missing.push("IGN");
                    }

                    if (!valueOf(player, "uid")) {
                        missing.push("UID");
                    }

                    if (!valueOf(player, "role")) {
                        missing.push("role");
                    }

                    if (!valueOf(
                        player,
                        "image",
                        "photo",
                        "avatar",
                        "profileImage"
                    )) {
                        missing.push("profile image");
                    }

                    if (!valueOf(
                        player,
                        "weaponName"
                    )) {
                        missing.push("favorite weapon");
                    }


                    return `

                        <div class="health-item">

                            <span class="health-dot"></span>

                            <div class="health-info">

                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                <span>
                                    Missing:
                                    ${escapeHTML(
                                        missing.join(", ")
                                    )}
                                </span>

                            </div>

                            <button
                                type="button"
                                class="cc-action-btn"
                                data-player-id="${escapeHTML(player.id)}"
                            >
                                Fix
                            </button>

                        </div>

                    `;

                })
                .join("");


        container
            .querySelectorAll("[data-player-id]")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const playerId =
                            button.dataset.playerId;

                        if (!playerId) {
                            return;
                        }

                        window.location.href =
                            `edit-player.html?id=${encodeURIComponent(
                                playerId
                            )}`;

                    }
                );

            });

    }


    /* ========================================================
       PROFILE HEALTH SCORE
       ======================================================== */

    function updateProfileHealthScore() {

        const scoreElement =
            el("profileHealthScore");

        const progressElement =
            el("profileHealthProgress");


        if (!scoreElement) {
            return;
        }


        const players =
            commandCenterData.players;


        if (!players.length) {

            scoreElement.textContent =
                "--";

            if (progressElement) {
                progressElement.style.width =
                    "0%";
            }

            return;
        }


        const incomplete =
            getIncompletePlayers().length;


        const healthy =
            Math.max(
                0,
                players.length - incomplete
            );


        const score =
            Math.round(
                (healthy / players.length) * 100
            );


        scoreElement.textContent =
            `${score}%`;


        if (progressElement) {

            progressElement.style.width =
                `${score}%`;

        }

    }


    /* ========================================================
       RECENT ACTIVITY
       ======================================================== */

    function renderRecentActivity() {

        const container =
            el("adminActivityList");


        if (!container) {
            return;
        }


        const activities = [];


        commandCenterData.players
            .forEach((player) => {

                activities.push({

                    icon:
                        "fa-user",

                    title:
                        "Player",

                    description:
                        valueOf(
                            player,
                            "name",
                            "username",
                            "playerName"
                        ) ||
                        "Player profile",

                    timestamp:
                        player.updatedAt ||
                        player.createdAt

                });

            });


        commandCenterData.tournaments
            .forEach((tournament) => {

                activities.push({

                    icon:
                        "fa-trophy",

                    title:
                        "Tournament",

                    description:
                        valueOf(
                            tournament,
                            "title",
                            "name",
                            "tournamentName"
                        ) ||
                        "Tournament",

                    timestamp:
                        tournament.updatedAt ||
                        tournament.createdAt

                });

            });


        commandCenterData.applications
            .forEach((application) => {

                activities.push({

                    icon:
                        "fa-file-circle-check",

                    title:
                        "Join Application",

                    description:
                        valueOf(
                            application,
                            "name",
                            "playerName"
                        ) ||
                        "New application",

                    timestamp:
                        application.updatedAt ||
                        application.createdAt

                });

            });


        commandCenterData.messages
            .forEach((message) => {

                activities.push({

                    icon:
                        "fa-envelope",

                    title:
                        "Contact Message",

                    description:
                        valueOf(
                            message,
                            "subject",
                            "name"
                        ) ||
                        "New message",

                    timestamp:
                        message.updatedAt ||
                        message.createdAt

                });

            });


        commandCenterData.challenges
            .forEach((challenge) => {

                activities.push({

                    icon:
                        "fa-bolt",

                    title:
                        "Challenge Registration",

                    description:
                        valueOf(
                            challenge,
                            "name",
                            "playerName",
                            "teamName"
                        ) ||
                        "Challenge registration",

                    timestamp:
                        challenge.updatedAt ||
                        challenge.createdAt

                });

            });


        activities.sort(
            (a, b) =>
                timestampValue(b.timestamp) -
                timestampValue(a.timestamp)
        );


        const latest =
            activities.slice(0, 8);


        if (!latest.length) {

            container.innerHTML = `

                <div class="cc-loading">
                    No recent activity available.
                </div>

            `;

            return;
        }


        container.innerHTML =
            latest
                .map((activity) => {

                    return `

                        <div class="admin-activity-item">

                            <div class="cc-action-icon">
                                <i class="fa-solid ${activity.icon}"></i>
                            </div>

                            <div class="activity-info">

                                <strong>
                                    ${escapeHTML(activity.title)}
                                </strong>

                                <span>
                                    ${escapeHTML(activity.description)}
                                </span>

                            </div>

                            <span class="activity-time">
                                ${escapeHTML(
                                    timeAgo(
                                        activity.timestamp
                                    )
                                )}
                            </span>

                        </div>

                    `;

                })
                .join("");

    }


    /* ========================================================
       GLOBAL SEARCH
       ======================================================== */

    function setupGlobalSearch() {

        const input =
            el("globalAdminSearch");

        const resultsBox =
            el("globalSearchResults");


        if (!input || !resultsBox) {
            return;
        }


        let searchTimer;


        input.addEventListener(
            "input",
            () => {

                clearTimeout(searchTimer);


                searchTimer =
                    setTimeout(() => {

                        performGlobalSearch(
                            input.value
                        );

                    }, 150);

            }
        );


        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape"
                ) {

                    input.value = "";

                    resultsBox.innerHTML = "";

                    resultsBox.hidden =
                        true;

                }

            }
        );


        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    (event.ctrlKey ||
                     event.metaKey) &&
                    event.key.toLowerCase() === "k"
                ) {

                    event.preventDefault();

                    input.focus();

                }

            }
        );

    }


    function searchableText(item) {

        return [

            item.id,

            item.name,

            item.username,

            item.playerName,

            item.title,

            item.tournamentName,

            item.subject,

            item.email,

            item.uid,

            item.ign,

            item.guild,

            item.role,

            item.rank,

            item.status,

            item.weaponName,

            item.teamName

        ]
            .filter(
                (value) =>
                    value !== undefined &&
                    value !== null
            )
            .join(" ")
            .toLowerCase();

    }


    function performGlobalSearch(query) {

        const resultsBox =
            el("globalSearchResults");


        if (!resultsBox) {
            return;
        }


        const search =
            String(query || "")
                .trim()
                .toLowerCase();


        if (!search) {

            resultsBox.innerHTML = "";

            resultsBox.hidden =
                true;

            return;
        }


        const results = [];


        commandCenterData.players
            .forEach((player) => {

                if (
                    searchableText(player)
                        .includes(search)
                ) {

                    results.push({

                        type: "PLAYER",

                        icon:
                            "fa-user",

                        title:
                            valueOf(
                                player,
                                "name",
                                "username",
                                "playerName"
                            ) ||
                            "Player",

                        subtitle:
                            valueOf(
                                player,
                                "ign"
                            ) ||
                            valueOf(
                                player,
                                "uid"
                            ) ||
                            "Player profile",

                        url:
                            `edit-player.html?id=${encodeURIComponent(
                                player.id
                            )}`

                    });

                }

            });


        commandCenterData.tournaments
            .forEach((tournament) => {

                if (
                    searchableText(tournament)
                        .includes(search)
                ) {

                    results.push({

                        type: "TOURNAMENT",

                        icon:
                            "fa-trophy",

                        title:
                            valueOf(
                                tournament,
                                "title",
                                "name",
                                "tournamentName"
                            ) ||
                            "Tournament",

                        subtitle:
                            "Tournament",

                        url:
                            `edit-tournament.html?id=${encodeURIComponent(
                                tournament.id
                            )}`

                    });

                }

            });


        commandCenterData.applications
            .forEach((application) => {

                if (
                    searchableText(application)
                        .includes(search)
                ) {

                    results.push({

                        type: "APPLICATION",

                        icon:
                            "fa-file-circle-check",

                        title:
                            valueOf(
                                application,
                                "name",
                                "playerName"
                            ) ||
                            "Join Application",

                        subtitle:
                            valueOf(
                                application,
                                "status"
                            ) ||
                            "Application",

                        url:
                            `view-application.html?id=${encodeURIComponent(
                                application.id
                            )}`

                    });

                }

            });


        commandCenterData.messages
            .forEach((message) => {

                if (
                    searchableText(message)
                        .includes(search)
                ) {

                    results.push({

                        type: "MESSAGE",

                        icon:
                            "fa-envelope",

                        title:
                            valueOf(
                                message,
                                "subject",
                                "name"
                            ) ||
                            "Contact Message",

                        subtitle:
                            valueOf(
                                message,
                                "email"
                            ) ||
                            "Message",

                        url:
                            `view-message.html?id=${encodeURIComponent(
                                message.id
                            )}`

                    });

                }

            });


        commandCenterData.challenges
            .forEach((challenge) => {

                if (
                    searchableText(challenge)
                        .includes(search)
                ) {

                    results.push({

                        type: "CHALLENGE",

                        icon:
                            "fa-bolt",

                        title:
                            valueOf(
                                challenge,
                                "name",
                                "playerName",
                                "teamName"
                            ) ||
                            "Challenge",

                        subtitle:
                            valueOf(
                                challenge,
                                "status"
                            ) ||
                            "Challenge Registration",

                        url:
                            "challenge-registrations.html"

                    });

                }

            });


        if (!results.length) {

            resultsBox.innerHTML = `

                <div class="search-empty">
                    No results found for
                    "<strong>${escapeHTML(query)}</strong>"
                </div>

            `;

            resultsBox.hidden =
                false;

            return;
        }


        resultsBox.innerHTML =
            results
                .slice(0, 15)
                .map((result) => {

                    return `

                        <button
                            type="button"
                            class="cc-search-result"
                            data-search-url="${escapeHTML(
                                result.url
                            )}"
                        >

                            <span class="cc-search-icon">

                                <i class="fa-solid ${result.icon}"></i>

                            </span>

                            <span class="cc-search-info">

                                <strong>
                                    ${escapeHTML(
                                        result.title
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        result.type
                                    )}
                                    •
                                    ${escapeHTML(
                                        result.subtitle
                                    )}
                                </small>

                            </span>

                            <span class="cc-search-arrow">
                                →
                            </span>

                        </button>

                    `;

                })
                .join("");


        resultsBox.hidden =
            false;


        resultsBox
            .querySelectorAll(
                "[data-search-url]"
            )
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            button.dataset.searchUrl;

                    }
                );

            });

    }


    /* ========================================================
       REFRESH
       ======================================================== */

    function setupRefresh() {

        const button =
            el("refreshCommandCenter");


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async () => {

                const oldHTML =
                    button.innerHTML;


                button.disabled =
                    true;

                button.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';


                try {

                    await loadCommandCenter();

                } finally {

                    button.disabled =
                        false;

                    button.innerHTML =
                        oldHTML;

                }

            }
        );

    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    async function initializeCommandCenter() {

        setupGlobalSearch();

        setupRefresh();

        await loadCommandCenter();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeCommandCenter
        );

    } else {

        initializeCommandCenter();

    }

})();