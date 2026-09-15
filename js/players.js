/* =========================================================
   4 FIRE UNITED - PLAYER PROFILE
   ========================================================= */

(function () {

    "use strict";

    /* =====================================================
       PLAYER ID
    ===================================================== */

    const params = new URLSearchParams(window.location.search);
    const playerKey = params.get("id");


    /* =====================================================
       CHECK PLAYER ID
    ===================================================== */

    if (!playerKey) {

        alert("Player not found!");
        return;

    }


    /* =====================================================
       LOAD PLAYER PROFILE
    ===================================================== */

    db.collection("players")
        .doc(playerKey)
        .get()

        .then((doc) => {

            if (!doc.exists) {

                alert("Player not found!");
                return;

            }


            const p = doc.data();


            /* =================================================
               PAGE TITLE
            ================================================= */

            document.title =
                `${p.ign || "Player"} | 4 FIRE UNITED`;


            /* =================================================
               HELPER
            ================================================= */

            function setText(id, value) {

                const element =
                    document.getElementById(id);

                if (element) {

                    element.textContent =
                        value ?? "";

                }

            }


            /* =================================================
               BASIC PLAYER INFO
            ================================================= */

            setText(
                "player-name",
                p.ign || ""
            );

            setText(
                "player-role",
                p.role || ""
            );

            setText(
                "player-uid",
                p.uid || ""
            );

            setText(
                "player-level",
                p.level || ""
            );

            setText(
                "player-rank",
                p.rank || ""
            );

            setText(
                "player-kd",
                p.kd || ""
            );

            setText(
                "player-headshot",
                p.headshot || ""
            );

            setText(
                "player-booyah",
                p.booyah || "-"
            );

            setText(
                "player-matches",
                p.matches || "-"
            );

            setText(
                "player-guild",
                p.guild || ""
            );

            setText(
                "player-language",
                p.language || ""
            );

            setText(
                "player-country",
                p.country || "India"
            );

            setText(
                "player-since",
                p.since || "2024"
            );


            /* =================================================
               LEVEL BADGE
            ================================================= */

            const levelBadge =
                document.getElementById(
                    "player-level-badge"
                );

            if (levelBadge) {

                levelBadge.textContent =
                    p.level || "";

            }


            /* =================================================
               CAREER HIGHLIGHTS
            ================================================= */

            setText(
                "player-kd-copy",
                p.kd || ""
            );

            setText(
                "player-headshot-copy",
                p.headshot || ""
            );

            setText(
                "player-booyah-copy",
                p.booyah || "-"
            );

            setText(
                "player-matches-copy",
                p.matches || "-"
            );


            /* =================================================
               PLAYER IMAGE
            ================================================= */

            const playerImage =
                document.getElementById(
                    "player-image"
                );

            if (playerImage) {

                playerImage.src =
                    p.image ||
                    "../images/logo/logo.png";

                playerImage.onerror = function () {

                    this.src =
                        "../images/logo/logo.png";

                };

            }


            /* =================================================
               COUNTRY FLAG
            ================================================= */

            const country =
                document.getElementById(
                    "player-country"
                );

            const flag =
                document.getElementById(
                    "player-flag"
                );


            const countryCodes = {

                India: "IN",
                Bangladesh: "BD",
                Nepal: "NP",
                Pakistan: "PK",
                Brazil: "BR",
                Indonesia: "ID",
                Thailand: "TH",
                Vietnam: "VN",
                "United States": "US",
                Russia: "RU"

            };


            if (country) {

                country.textContent =
                    p.country || "India";

            }


            if (flag) {

                const code =
                    countryCodes[p.country] || "IN";

                flag.src =
                    `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`;

            }


            /* =================================================
               RANK BADGE
            ================================================= */

            const rankBadge =
                document.getElementById(
                    "player-rank-badge"
                );

            const rankIcon =
                document.getElementById(
                    "rank-icon"
                );


            if (rankBadge && rankIcon) {

                rankBadge.className =
                    "rank-badge";


                const rank =
                    String(
                        p.rank || ""
                    ).toLowerCase();


                if (rank.includes("bronze")) {

                    rankBadge.classList.add("bronze");

                    rankIcon.className =
                        "fa-solid fa-medal";

                }

                else if (rank.includes("silver")) {

                    rankBadge.classList.add("silver");

                    rankIcon.className =
                        "fa-solid fa-shield-halved";

                }

                else if (rank.includes("gold")) {

                    rankBadge.classList.add("gold");

                    rankIcon.className =
                        "fa-solid fa-trophy";

                }

                else if (rank.includes("platinum")) {

                    rankBadge.classList.add("platinum");

                    rankIcon.className =
                        "fa-solid fa-gem";

                }

                else if (rank.includes("diamond")) {

                    rankBadge.classList.add("diamond");

                    rankIcon.className =
                        "fa-solid fa-gem";

                }

                else if (rank.includes("elite")) {

                    rankBadge.classList.add(
                        "elite-heroic"
                    );

                    rankIcon.className =
                        "fa-solid fa-bolt";

                }

                else if (rank.includes("heroic")) {

                    rankBadge.classList.add(
                        "heroic"
                    );

                    rankIcon.className =
                        "fa-solid fa-fire";

                }

                else if (rank.includes("grandmaster")) {

                    rankBadge.classList.add(
                        "grandmaster"
                    );

                    rankIcon.className =
                        "fa-solid fa-star";

                }

                else if (rank.includes("master")) {

                    rankBadge.classList.add(
                        "master"
                    );

                    rankIcon.className =
                        "fa-solid fa-crown";

                }

                else {

                    rankBadge.classList.add(
                        "bronze"
                    );

                    rankIcon.className =
                        "fa-solid fa-medal";

                }

            }


            /* =================================================
               FAVORITE WEAPON
            ================================================= */

            const weaponName =
                document.getElementById(
                    "player-weapon"
                );

            const weaponType =
                document.getElementById(
                    "player-weapon-type"
                );

            const weaponQuote =
                document.getElementById(
                    "player-weapon-quote"
                );

            const weaponImage =
                document.getElementById(
                    "player-weapon-image"
                );


            if (weaponName) {

                weaponName.textContent =
                    p.weaponName || "M1887";

            }


            if (weaponType) {

                weaponType.textContent =
                    p.weaponType || "SHOTGUN";

            }


            if (weaponQuote) {

                weaponQuote.textContent =
                    p.weaponQuote ||
                    "No favorite quote";

            }


            if (weaponImage) {

                weaponImage.src =
                    p.weaponImage ||
                    "../images/logo/logo.png";

                weaponImage.onerror =
                    function () {

                        this.src =
                            "../images/logo/logo.png";

                    };

            }


            /* =================================================
               SOCIAL MEDIA
            ================================================= */

            const socials = [

                {
                    id: "playerInstagram",
                    url: p.instagram
                },

                {
                    id: "playerYoutube",
                    url: p.youtube
                },

                {
                    id: "playerDiscord",
                    url: p.discord
                },

                {
                    id: "playerFacebook",
                    url: p.facebook
                }

            ];


            socials.forEach((social) => {

                const button =
                    document.getElementById(
                        social.id
                    );


                if (!button) {
                    return;
                }


                if (
                    social.url &&
                    social.url.trim() !== ""
                ) {

                    button.href =
                        social.url;

                    button.target =
                        "_blank";

                    button.rel =
                        "noopener noreferrer";

                    button.style.display =
                        "";

                }

                else {

                    button.style.display =
                        "none";

                }

            });


            /* =================================================
               PLAYER EDIT BUTTON
            ================================================= */

            auth.onAuthStateChanged((user) => {

                if (!user) {
                    return;
                }


                if (
                    p.loginEmail &&
                    user.email &&
                    p.loginEmail.toLowerCase() ===
                    user.email.toLowerCase()
                ) {

                    const editArea =
                        document.getElementById(
                            "player-edit-area"
                        );

                    const editButton =
                        document.getElementById(
                            "edit-player-btn"
                        );


                    if (
                        editArea &&
                        editButton
                    ) {

                        editArea.style.display =
                            "block";

                        editButton.href =
                            `../player-edit-profile.html?id=${encodeURIComponent(playerKey)}`;

                    }

                }

            });


            /* =================================================
               LOAD PLAYER GAMES
            ================================================= */

            loadPlayerGames(playerKey);

        })

        .catch((error) => {

            console.error(
                "Player loading error:",
                error
            );

        });


    /* =========================================================
       PLAYER GAME CENTER
       ========================================================= */

    function loadPlayerGames(playerId) {

        const gameContainer =
            document.getElementById(
                "player-games"
            );


        if (!gameContainer) {

            console.warn(
                "player-games container not found."
            );

            return;

        }


        gameContainer.innerHTML = `

            <div class="game-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <span>
                    Loading games...
                </span>

            </div>

        `;


        /*
         * Games are stored inside:
         *
         * players
         *    └── PLAYER_ID
         *          └── games
         *                ├── game1
         *                ├── game2
         *                └── game3
         *
         */


        db.collection("players")
            .doc(playerId)
            .collection("games")
            .orderBy("createdAt", "asc")
            .get()

            .then((snapshot) => {

                gameContainer.innerHTML = "";


                if (snapshot.empty) {

                    gameContainer.innerHTML = `

                        <div class="no-games">

                            <i class="fa-solid fa-gamepad"></i>

                            <h3>No Games Added</h3>

                            <p>
                                This player has not added any games yet.
                            </p>

                        </div>

                    `;

                    return;

                }


                snapshot.forEach((doc) => {

                    const game =
                        doc.data();


                    const name =
                        escapeHtml(
                            game.name ||
                            "Game"
                        );


                    const icon =
                        game.icon ||
                        "../images/logo/logo.png";


                    const appLink =
                        game.appLink ||
                        game.link ||
                        "#";


                    const webLink =
                        game.webLink ||
                        game.url ||
                        "";


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "player-game-card";


                    card.innerHTML = `

                        <div class="game-icon">

                            <img
                                src="${icon}"
                                alt="${name}"
                                onerror="
                                    this.src='../images/logo/logo.png';
                                "
                            >

                        </div>


                        <div class="game-info">

                            <h3>
                                ${name}
                            </h3>

                            <p>
                                Installed Game
                            </p>

                        </div>


                        <div class="game-action">

                            <a
                                href="${appLink}"
                                class="open-game-btn"
                            >

                                <i class="fa-solid fa-play"></i>

                                Open

                            </a>

                        </div>

                    `;


                    gameContainer.appendChild(
                        card
                    );


                    /*
                     * If app link doesn't open,
                     * normal web link can be used.
                     */

                    const openButton =
                        card.querySelector(
                            ".open-game-btn"
                        );


                    if (
                        webLink &&
                        appLink === "#"
                    ) {

                        openButton.href =
                            webLink;

                    }

                });

            })

            .catch((error) => {

                console.error(
                    "Game Loading Error:",
                    error
                );


                gameContainer.innerHTML = `

                    <div class="game-error">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <h3>
                            Unable to load games
                        </h3>

                        <p>
                            ${escapeHtml(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            });

    }


    /* =========================================================
       HTML ESCAPE
    ========================================================= */

    function escapeHtml(value) {

        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =========================================================
       WEAPON PARALLAX
    ========================================================= */

    function initWeaponParallax() {

        const weaponCard =
            document.querySelector(
                ".weapon-card"
            );

        const weaponImg =
            document.querySelector(
                ".weapon-image img"
            );


        if (
            !weaponCard ||
            !weaponImg
        ) {

            return;

        }


        weaponCard.addEventListener(
            "mousemove",
            (event) => {

                const rect =
                    weaponCard.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                const moveX =
                    (x - rect.width / 2) / 20;


                const moveY =
                    (y - rect.height / 2) / 20;


                weaponImg.style.transform =
                    `translate(${moveX}px, ${moveY}px) rotate(${moveX / 2}deg) scale(1.08)`;

            }
        );


        weaponCard.addEventListener(
            "mouseleave",
            () => {

                weaponImg.style.transform =
                    "translate(0,0) rotate(0deg) scale(1)";

            }
        );

    }


    /* =========================================================
       START PARALLAX AFTER DOM LOAD
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initWeaponParallax
        );

    }

    else {

        initWeaponParallax();

    }


})();