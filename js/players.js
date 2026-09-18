/* =========================================================
   4 FIRE UNITED - PLAYER PROFILE + GAME CENTER
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       PLAYER ID
    ===================================================== */

    const params =
        new URLSearchParams(window.location.search);

    const playerKey =
        params.get("id");


    if (!playerKey) {

        alert("Player not found!");

        return;

    }


    /* =====================================================
       GAME DATABASE
    ===================================================== */

    const GAME_CATALOG = {

        freefiremax: {

            id: "freefiremax",

            name: "Free Fire MAX",

            publisher: "Garena Free Fire MAX",

            logo:
                "../images/games/free-fire-max.png",

            appLink:
                "freefiremax://",

            webLink:
                "https://play.google.com/store/apps/details?id=com.dts.freefiremax"

        },


        freefire: {

            id: "freefire",

            name: "Free Fire",

            publisher: "Garena Free Fire",

            logo:
                "../images/games/free-fire.png",

            appLink:
                "freefire://",

            webLink:
                "https://play.google.com/store/apps/details?id=com.dts.freefireth"

        },


        bgmi: {

            id: "bgmi",

            name: "BGMI",

            publisher: "KRAFTON",

            logo:
                "../images/games/bgmi.png",

            appLink:
                "bgmi://",

            webLink:
                "https://play.google.com/store/apps/details?id=com.pubg.imobile"

        },


        pubgmobile: {

            id: "pubgmobile",

            name: "PUBG MOBILE",

            publisher: "Level Infinite",

            logo:
                "../images/games/pubg-mobile.png",

            appLink:
                "pubgm://",

            webLink:
                "https://play.google.com/store/apps/details?id=com.tencent.ig"

        },


        codmobile: {

            id: "codmobile",

            name: "Call of Duty Mobile",

            publisher: "Activision",

            logo:
                "../images/games/cod-mobile.png",

            appLink:
                "codm://",

            webLink:
                "https://play.google.com/store/apps/details?id=com.activision.callofduty.shooter"

        },


        efootball: {

            id: "efootball",

            name: "eFootball",

            publisher: "KONAMI",

            logo:
                "../images/games/efootball.png",

            appLink:
                "efootball://",

            webLink:
                "https://play.google.com/store/apps/details?id=jp.konami.pesam"

        },


        clashofclans: {

            id: "clashofclans",

            name: "Clash of Clans",

            publisher: "Supercell",

            logo:
                "../images/games/clash-of-clans.png",

            appLink:
                "clashofclans://",

            webLink:
                "https://play.google.com/store/apps/details?id=com.supercell.clashofclans"

        },


        clashroyale: {

            id: "clashroyale",

            name: "Clash Royale",

            publisher: "Supercell",

            logo:
                "../images/games/clash-royale.png",

            appLink:
                "clashroyale://",

            webLink:
                "https://play.google.com/store/apps/details?id=com.supercell.clashroyale"

        }

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    function setText(id, value) {

        const element =
            getElement(id);

        if (element) {

            element.textContent =
                value ?? "";

        }

    }


    function escapeHtml(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }



    /* =====================================================
       LIVE FREE FIRE DATA
    ===================================================== */

   function applyLiveFreeFireData(data) {

    if (!data || typeof data !== "object") return;

    const basic = data.basicInfo || data.basic_info || data.profile || data;
    const stats = data.stats || data.playerStats || data.statistics || data;
    const clan = data.clanBasicInfo || data.clan_basic_info || {};

    const pick = (...values) => values.find(value =>
        value !== undefined && value !== null && value !== ""
    );

    const number = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    };

    const percent = (a, b) => {
        const x = number(a);
        const y = number(b);
        return x !== null && y ? `${((x / y) * 100).toFixed(2)}%` : "—";
    };

    const liveName = pick(basic.nickname, basic.name, data.nickname, data.name);
    const liveUid = pick(basic.accountId, basic.uid, data.uid);
    const liveLevel = pick(basic.level, data.level);

    /*
     * Free Fire API's `rank` field is a numeric rank/code.
     * Use BR ranking points to show the readable player-facing rank
     * when the API does not provide rankName.
     */
    function rankNameFromPoints(points) {
        const rp = number(points);
        if (rp === null) return null;

        if (rp >= 10800) return "Grandmaster";
        if (rp >= 7700) return "Elite Master";
        if (rp >= 6500) return "Master";
        if (rp >= 5400) return "Elite Heroic";
        if (rp >= 3200) return "Heroic";
        if (rp >= 2600) return "Diamond";
        if (rp >= 2100) return "Platinum";
        if (rp >= 1600) return "Gold";
        if (rp >= 1300) return "Silver";
        return "Bronze";
    }

    const brRankingPoints = pick(
        data.rankingPoints,
        basic.rankingPoints,
        basic.ranking_points,
        stats.rankingPoints,
        stats.ranking_points
    );

    const liveRank = pick(
        basic.rankName,
        data.rankName,
        rankNameFromPoints(brRankingPoints),
        basic.rank,
        data.rank
    );

    const matches = pick(stats.matches, stats.gamesPlayed, stats.totalMatches);
    const booyah = pick(stats.booyah, stats.wins, stats.totalWins);
    const kills = pick(stats.kills, stats.totalKills);
    const deaths = pick(stats.deaths, stats.totalDeaths);

    let kd = pick(stats.kd, stats.kdRatio, data.kd);
    if (kd === undefined) {
        const k = number(kills);
        const d = number(deaths);
        if (k !== null && d !== null && d > 0) kd = (k / d).toFixed(2);
    }

    const headshot = pick(
        stats.headshot,
        stats.headshotRate,
        stats.headshotPercentage,
        data.headshot,
        data.headshotRate
    );

    const liveGuild = pick(
        data.guild,
        clan.clanName,
        clan.name,
        data.clanName
    );

    /* Existing profile UI stays connected to live API data. */
    if (liveName !== undefined) {
        setText("player-name", liveName);
        document.title = `${liveName} | 4 FIRE UNITED`;
    }
    if (liveUid !== undefined) setText("player-uid", liveUid);
    if (liveLevel !== undefined) {
        setText("player-level", liveLevel);
        const levelBadge = getElement("player-level-badge");
        if (levelBadge) levelBadge.textContent = liveLevel;
    }
    if (liveRank !== undefined) {
        setText("player-rank", liveRank);

        const rankBadge = getElement("player-rank-badge");
        const rankIcon = getElement("rank-icon");

        if (rankBadge && rankIcon) {
            const rank = String(liveRank).toLowerCase();
            rankBadge.className = "rank-badge";

            if (rank.includes("grandmaster")) {
                rankBadge.classList.add("grandmaster");
                rankIcon.className = "fa-solid fa-star";
            } else if (rank.includes("elite master")) {
                rankBadge.classList.add("master");
                rankIcon.className = "fa-solid fa-crown";
            } else if (rank.includes("master")) {
                rankBadge.classList.add("master");
                rankIcon.className = "fa-solid fa-crown";
            } else if (rank.includes("elite heroic")) {
                rankBadge.classList.add("elite-heroic");
                rankIcon.className = "fa-solid fa-bolt";
            } else if (rank.includes("heroic")) {
                rankBadge.classList.add("heroic");
                rankIcon.className = "fa-solid fa-fire";
            } else if (rank.includes("diamond")) {
                rankBadge.classList.add("diamond");
                rankIcon.className = "fa-solid fa-gem";
            } else if (rank.includes("platinum")) {
                rankBadge.classList.add("platinum");
                rankIcon.className = "fa-solid fa-gem";
            } else if (rank.includes("gold")) {
                rankBadge.classList.add("gold");
                rankIcon.className = "fa-solid fa-trophy";
            } else if (rank.includes("silver")) {
                rankBadge.classList.add("silver");
                rankIcon.className = "fa-solid fa-shield-halved";
            } else {
                rankBadge.classList.add("bronze");
                rankIcon.className = "fa-solid fa-medal";
            }
        }
    }
    if (matches !== undefined) {
        setText("player-matches", matches);
        setText("player-matches-copy", matches);
    }
    if (booyah !== undefined) {
        setText("player-booyah", booyah);
        setText("player-booyah-copy", booyah);
    }
    if (kd !== undefined) {
        setText("player-kd", kd);
        setText("player-kd-copy", kd);
    }
    if (headshot !== undefined) {
        setText("player-headshot", headshot);
        setText("player-headshot-copy", headshot);
    }
    if (liveGuild !== undefined) setText("player-guild", liveGuild);

    /* =========================================================
       NEW API-ONLY PROFILE DATA
       These fields are intentionally separate from the old stats.
    ========================================================= */
    const setLive = (id, value) => {
        const el = getElement(id);
        if (!el) return;
        el.textContent = value === undefined || value === null || value === "" ? "—" : value;
    };

    const likes = pick(data.likes, data.liked, basic.likes, basic.liked);
    const brRp = pick(
        data.rankingPoints,
        basic.rankingPoints,
        basic.ranking_points,
        stats.rankingPoints,
        stats.ranking_points
    );
    const csRank = pick(data.csRank, basic.csRank, basic.cs_rank);
    const csRp = pick(data.csRankingPoints, basic.csRankingPoints, basic.cs_ranking_points);
    const accountLevel = pick(data.level, basic.level);
    const region = pick(data.region, basic.region, "IND");
    const guildId = pick(
        data.guildId,
        data.clanId,
        clan.clanId,
        clan.id,
        data.rawProfile?.clanBasicInfo?.clanId,
        data.rawProfile?.clan?.clanId
    );
    const social = data.socialInfo || data.social_info || data.rawProfile?.socialInfo || {};
    const language = pick(data.language, social.language, social.languageCode);
    const gender = pick(data.gender, social.gender, data.rawProfile?.gender);
    const releaseVersion = pick(
        data.releaseVersion,
        data.rawProfile?.releaseVersion,
        data.rawProfile?.release_version,
        data.rawAccount?.releaseVersion
    );

    setLive("ffx-likes", likes);
    setLive("ffx-br-rp", brRp);
    setLive("ffx-cs-rank", csRank);
    setLive("ffx-cs-rp", csRp);
    setLive("ffx-uid", liveUid);
    setLive("ffx-name", liveName);
    setLive("ffx-region", region);
    setLive("ffx-br-rank", liveRank);
    setLive("ffx-guild", liveGuild);
    setLive("ffx-guild-id", guildId);
    setLive("ffx-language", language);
    setLive("ffx-gender", gender);
    setLive("ffx-version", releaseVersion);
    setLive("ffx-account-level", accountLevel);

    /* Pet information from the API. */
    const pet = data.petInfo || data.pet || data.rawProfile?.petInfo || data.rawProfile?.pet;
    const petBox = getElement("ffx-pet-content");
    if (petBox) {
        if (pet && typeof pet === "object") {
            const values = [
                ["Pet ID", pick(pet.id, pet.petId, pet.petID)],
                ["Pet Name", pick(pet.name, pet.petName, pet.nickname)],
                ["Level", pick(pet.level, pet.petLevel)],
                ["Skill", pick(pet.skill, pet.skillName)],
                ["Selected", pick(pet.selected, pet.isSelected)]
            ].filter(item => item[1] !== undefined && item[1] !== null && item[1] !== "");

            if (values.length) {
                petBox.innerHTML = `<div class="ffx-info-list">${values.map(item =>
                    `<div><span>${escapeHtml(item[0])}</span><b>${escapeHtml(item[1])}</b></div>`
                ).join("")}</div>`;
            } else {
                petBox.innerHTML = `<div class="ffx-pet-empty"><i class="fa-solid fa-paw"></i><span>Pet data unavailable</span></div>`;
            }
        } else {
            petBox.innerHTML = `<div class="ffx-pet-empty"><i class="fa-solid fa-paw"></i><span>No pet data available</span></div>`;
        }
    }

    /* =========================================================
       SOLO / DUO / SQUAD MODE DATA
       Handles both the Worker normalized response and nested raw API data.
    ========================================================= */
    const normalizeKey = key => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    function findMode(root, aliases, depth = 0, seen = new Set()) {
        if (!root || typeof root !== "object" || depth > 7 || seen.has(root)) return null;
        seen.add(root);

        const aliasSet = new Set(aliases.map(normalizeKey));
        for (const [key, value] of Object.entries(root)) {
            if (aliasSet.has(normalizeKey(key)) && value && typeof value === "object") return value;
        }

        for (const value of Object.values(root)) {
            if (value && typeof value === "object") {
                const found = findMode(value, aliases, depth + 1, seen);
                if (found) return found;
            }
        }
        return null;
    }

    function modeField(mode, aliases) {
        if (!mode || typeof mode !== "object") return null;
        const wanted = new Set(aliases.map(normalizeKey));
        const queue = [mode];
        const seen = new Set();

        while (queue.length) {
            const obj = queue.shift();
            if (!obj || typeof obj !== "object" || seen.has(obj)) continue;
            seen.add(obj);

            for (const [key, value] of Object.entries(obj)) {
                if (wanted.has(normalizeKey(key))) {
                    const n = number(value);
                    return n !== null ? n : value;
                }
                if (value && typeof value === "object") queue.push(value);
            }
        }
        return null;
    }

    const rawStats = data.rawStats || data.raw_stats || data.stats || data;
    const modeRoots = {
        solo: ["solo", "soloStats", "soloCareer", "soloMode"],
        duo: ["duo", "duoStats", "duoCareer", "duoMode"],
        squad: ["squad", "squadStats", "squadCareer", "squadMode", "quad", "quadStats", "quadCareer", "quadMode"]
    };

    for (const modeName of ["solo", "duo", "squad"]) {
        const mode = findMode(rawStats, modeRoots[modeName]);
        if (!mode) continue;

        const m = modeField(mode, ["gamesplayed", "gamesPlayed", "matches", "games", "totalMatches"]);
        const w = modeField(mode, ["wins", "win", "booyah", "totalWins"]);
        const k = modeField(mode, ["kills", "kill", "totalKills"]);
        let d = modeField(mode, ["deaths", "death", "totalDeaths"]);
        const hs = modeField(mode, ["headshots", "headshot", "totalHeadshots"]);
        const hsk = modeField(mode, ["headshotkills", "headshotKills", "headshot_kills", "hsKills", "totalHeadshotKills"]);

        setLive(`ffx-${modeName}-matches`, m);
        setLive(`ffx-${modeName}-wins`, w);
        setLive(`ffx-${modeName}-kills`, k);
        setLive(`ffx-${modeName}-deaths`, d);
        setLive(`ffx-${modeName}-hs`, hs);
        setLive(`ffx-${modeName}-hsk`, hsk);

        if (d === null && m !== null && w !== null) d = Math.max(0, m - w);
        setLive(`ffx-${modeName}-kd`, k !== null && d !== null && d > 0 ? (k / d).toFixed(2) : "—");
        setLive(`ffx-${modeName}-winrate`, percent(w, m));
        setLive(`ffx-${modeName}-hsrate`, percent(hsk, k));
    }

    /* Share card setup is initialized once; live data is read when opened. */
    initLiveShareCard();

    setLive("ffx-live-label", "LIVE SYNC");
    setLive("ffx-updated", `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`);
    setLive("ff-live-status", "Live data synced");

    window.__4fuLiveData = data;

    console.info("[4FU] Live Free Fire data + new API fields applied.");
}


function initLiveShareCard() {

    const button = getElement("ffx-share-btn");
    const modal = getElement("ffx-share-modal");

    if (!button || !modal || button.dataset.bound === "1") return;
    button.dataset.bound = "1";

    const close = () => {
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
    };

    getElement("ffx-share-close")?.addEventListener("click", close);
    getElement("ffx-share-x")?.addEventListener("click", close);

    button.addEventListener("click", () => {
        const data = window.__4fuLiveData || {};
        const basic = data.basicInfo || {};
        const liveStats = data.stats || {};

        setText("ffx-share-name", data.name || basic.nickname || getElement("player-name")?.textContent?.trim() || "Player");
        setText("ffx-share-uid", `UID ${data.uid || basic.accountId || getElement("player-uid")?.textContent?.trim() || "—"}`);
        setText("ffx-share-kd", liveStats.kd || data.kd || getElement("player-kd")?.textContent?.trim() || "—");
        setText("ffx-share-rp", data.rankingPoints || basic.rankingPoints || "—");
        setText("ffx-share-likes", data.likes || basic.liked || "—");

        const profileImage = getElement("player-image");
        const shareImage = getElement("ffx-share-img");
        if (profileImage && shareImage) shareImage.src = profileImage.src;

        const profileUrl = window.location.href;
        setText("ffx-share-url", profileUrl);

        const qr = getElement("ffx-qr");
        if (qr) {
            qr.innerHTML = "";
            const image = new Image();
            image.alt = "QR code";
            image.width = 120;
            image.height = 120;
            image.loading = "lazy";
            image.src = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + encodeURIComponent(profileUrl);
            qr.appendChild(image);
        }

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    });

    getElement("ffx-copy-link")?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const btn = getElement("ffx-copy-link");
            if (!btn) return;
            const old = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> COPIED';
            setTimeout(() => { btn.innerHTML = old; }, 1400);
        } catch (error) {
            console.warn("[4FU] Copy profile link failed:", error);
        }
    });
}

    /* =====================================================
       LOAD PLAYER
    ===================================================== */

    db.collection("players")
        .doc(playerKey)
        .get()

        .then((doc) => {

            if (!doc.exists) {

                alert("Player not found!");

                return;

            }


            const p =
                doc.data();


            

            /* =================================================
               FETCH LIVE FREE FIRE DATA
            ================================================= */

            if (
                typeof window.getFreeFirePlayer === "function" &&
                p.uid
            ) {
                window.getFreeFirePlayer(
                    p.uid,
                    p.region || "IND"
                )
                    .then((liveData) => {
                        if (liveData) {
                            applyLiveFreeFireData(liveData);
                        }
                    })
                    .catch((error) => {
                        console.warn(
                            "[4FU] Live Free Fire data unavailable:",
                            error
                        );
                    });
            }

/* =================================================
               PAGE TITLE
            ================================================= */

            document.title =
                `${p.ign || "Player"} | 4 FIRE UNITED`;


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
               ROLE COPY
            ================================================= */

            setText(
                "player-role-copy",
                p.role || ""
            );


            /* =================================================
               CAREER COPY
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
               LEVEL BADGE
            ================================================= */

            const levelBadge =
                getElement("player-level-badge");


            if (levelBadge) {

                levelBadge.textContent =
                    p.level || "";

            }


            /* =================================================
               PLAYER IMAGE
            ================================================= */

            const playerImage =
                getElement("player-image");


            if (playerImage) {

                playerImage.src =
                    p.image ||
                    "../images/logo/logo.png";


                playerImage.onerror =
                    function () {

                        this.src =
                            "../images/logo/logo.png";

                    };

            }


            /* =================================================
               COUNTRY FLAG
            ================================================= */

            const country =
                getElement("player-country");

            const flag =
                getElement("player-flag");


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
                getElement("player-rank-badge");

            const rankIcon =
                getElement("rank-icon");


            if (rankBadge && rankIcon) {

                rankBadge.className =
                    "rank-badge";


                const rank =
                    String(
                        p.rank || ""
                    ).toLowerCase();


                if (rank.includes("bronze")) {

                    rankBadge.classList.add(
                        "bronze"
                    );

                    rankIcon.className =
                        "fa-solid fa-medal";

                }

                else if (rank.includes("silver")) {

                    rankBadge.classList.add(
                        "silver"
                    );

                    rankIcon.className =
                        "fa-solid fa-shield-halved";

                }

                else if (rank.includes("gold")) {

                    rankBadge.classList.add(
                        "gold"
                    );

                    rankIcon.className =
                        "fa-solid fa-trophy";

                }

                else if (rank.includes("platinum")) {

                    rankBadge.classList.add(
                        "platinum"
                    );

                    rankIcon.className =
                        "fa-solid fa-gem";

                }

                else if (rank.includes("diamond")) {

                    rankBadge.classList.add(
                        "diamond"
                    );

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
                getElement("player-weapon");

            const weaponType =
                getElement("player-weapon-type");

            const weaponQuote =
                getElement("player-weapon-quote");

            const weaponImage =
                getElement("player-weapon-image");


            if (weaponName) {

                weaponName.textContent =
                    p.weaponName ||
                    "M1887";

            }


            if (weaponType) {

                weaponType.textContent =
                    p.weaponType ||
                    "SHOTGUN";

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
                    getElement(social.id);


                if (!button) {

                    return;

                }


                if (
                    social.url &&
                    String(social.url).trim() !== ""
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
               AUTH + OWNER
            ================================================= */

            auth.onAuthStateChanged((user) => {

                setupOwnerControls(
                    user,
                    p
                );

            });


            /* =================================================
               LOAD GAMES
            ================================================= */

            renderPlayerGames(
                Array.isArray(p.games)
                    ? p.games
                    : []
            );

        })


        .catch((error) => {

            console.error(
                "Player loading error:",
                error
            );

        });


    /* =========================================================
       OWNER CONTROLS
    ========================================================= */

    function setupOwnerControls(
        user,
        player
    ) {

        const editArea =
            getElement(
                "player-edit-area"
            );


        const editButton =
            getElement(
                "edit-player-btn"
            );


        const addPanel =
            getElement(
                "game-add-panel"
            );


        let isOwner = false;


        if (
            user &&
            user.email &&
            player &&
            player.loginEmail
        ) {

            isOwner =
                player.loginEmail
                    .toLowerCase() ===
                user.email
                    .toLowerCase();

        }


        /* ==============================================
           EDIT PROFILE
        ============================================== */

        if (
            isOwner &&
            editArea &&
            editButton
        ) {

            editArea.style.display =
                "block";


            editButton.href =
                `../player-edit-profile.html?id=${encodeURIComponent(playerKey)}`;

        }


        /* ==============================================
           DIRECT GAME ADD
        ============================================== */

        if (addPanel) {

            if (isOwner) {

                addPanel.style.display =
                    "block";

            }

            else {

                addPanel.style.display =
                    "none";

            }

        }


        /* ==============================================
           DELETE BUTTONS
        ============================================== */

        document
            .querySelectorAll(
                ".remove-game-btn"
            )
            .forEach((button) => {

                button.style.display =
                    isOwner
                        ? "flex"
                        : "none";

            });

    }


    /* =========================================================
       LOAD GAME DROPDOWN
    ========================================================= */

    function loadGameDropdown() {

        const select =
            getElement(
                "game-selector"
            );


        if (!select) {

            return;

        }


        /*
         * Existing HTML options ko remove
         * nahi kar rahe.
         *
         * Sirf catalog ke according
         * selected game verify hoga.
         */


        Object.values(
            GAME_CATALOG
        )
        .forEach((game) => {

            const existingOption =
                select.querySelector(
                    `option[value="${game.id}"]`
                );


            if (!existingOption) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    game.id;


                option.textContent =
                    game.name;


                select.appendChild(
                    option
                );

            }

        });

    }


    /* =========================================================
       ADD GAME BUTTON
    ========================================================= */

    function initAddGame() {

        const button =
            getElement(
                "add-game-btn"
            );


        const select =
            getElement(
                "game-selector"
            );


        if (
            !button ||
            !select
        ) {

            return;

        }


        button.addEventListener(
            "click",
            async function () {

                /* =========================================
                   AUTH CHECK
                ========================================= */

                const user =
                    auth.currentUser;


                if (!user) {

                    alert(
                        "Please login first."
                    );

                    return;

                }


                /* =========================================
                   GET PLAYER
                ========================================= */

                let player;


                try {

                    const doc =
                        await db
                            .collection("players")
                            .doc(playerKey)
                            .get();


                    if (!doc.exists) {

                        alert(
                            "Player profile not found."
                        );

                        return;

                    }


                    player =
                        doc.data();

                }

                catch (error) {

                    console.error(
                        "Player check error:",
                        error
                    );


                    alert(
                        error.message
                    );

                    return;

                }


                /* =========================================
                   OWNER CHECK
                ========================================= */

                if (
                    !player.loginEmail ||
                    !user.email ||
                    player.loginEmail
                        .toLowerCase() !==
                    user.email
                        .toLowerCase()
                ) {

                    alert(
                        "You can only add games to your own profile."
                    );

                    return;

                }


                /* =========================================
                   SELECT GAME
                ========================================= */

                const gameId =
                    select.value;


                if (!gameId) {

                    alert(
                        "Please select a game."
                    );

                    return;

                }


                const game =
                    GAME_CATALOG[gameId];


                if (!game) {

                    alert(
                        "Invalid game selected."
                    );

                    return;

                }


                /* =========================================
                   EXISTING GAMES
                ========================================= */

                const existingGames =
                    Array.isArray(
                        player.games
                    )
                        ? player.games
                        : [];


                const alreadyAdded =
                    existingGames.some(
                        (item) => {

                            return (
                                item.id === game.id ||
                                item.gameId === game.id ||
                                item.key === game.id
                            );

                        }
                    );


                if (alreadyAdded) {

                    alert(
                        `${game.name} is already added.`
                    );

                    return;

                }


                /* =========================================
                   NEW GAME
                ========================================= */

                const newGame = {

                    id:
                        game.id,

                    name:
                        game.name,

                    publisher:
                        game.publisher,

                    logo:
                        game.logo,

                    appLink:
                        game.appLink,

                    webLink:
                        game.webLink,

                    addedAt:
                        new Date().toISOString()

                };


                /* =========================================
                   BUTTON LOADING
                ========================================= */

                button.disabled =
                    true;


                button.innerHTML = `

                    <i
                        class="fa-solid fa-spinner fa-spin"
                    ></i>

                    Adding...

                `;


                try {

                    /* =====================================
                       SAVE TO PLAYER DOCUMENT
                    ===================================== */

                    const updatedGames =
                        [
                            ...existingGames,
                            newGame
                        ];


                    await db
                        .collection("players")
                        .doc(playerKey)
                        .update({

                            games:
                                updatedGames

                        });


                    /* =====================================
                       RESET
                    ===================================== */

                    select.value =
                        "";


                    alert(
                        `${game.name} added successfully!`
                    );


                    /* =====================================
                       RENDER WITHOUT RELOAD
                    ===================================== */

                    renderPlayerGames(
                        updatedGames
                    );


                }

                catch (error) {

                    console.error(
                        "Add game error:",
                        error
                    );


                    alert(
                        "Game add failed.\n\n" +
                        error.message
                    );

                }

                finally {

                    button.disabled =
                        false;


                    button.innerHTML = `

                        <i
                            class="fa-solid fa-plus"
                        ></i>

                        Add Game

                    `;

                }

            }

        );

    }


    /* =========================================================
       RENDER PLAYER GAMES
    ========================================================= */

    function renderPlayerGames(
        games
    ) {

        const container =
            getElement(
                "player-games-container"
            );


        if (!container) {

            console.warn(
                "player-games-container not found."
            );

            return;

        }


        container.className =
            "player-games-grid";


        container.innerHTML =
            "";


        if (
            !Array.isArray(games) ||
            games.length === 0
        ) {

            container.innerHTML = `

                <div class="no-games">

                    <i
                        class="fa-solid fa-gamepad"
                    ></i>

                    <h3>
                        No Games Added
                    </h3>

                    <p>
                        This player has not added any games yet.
                    </p>

                </div>

            `;

            return;

        }


        games.forEach(
            (game) => {

                /*
                 * OLD DATA COMPATIBILITY
                 */

                const gameId =
                    game.id ||
                    game.gameId ||
                    game.key;


                const catalogGame =
                    GAME_CATALOG[gameId];


                const gameName =
                    game.name ||
                    catalogGame?.name ||
                    "Game";


                const publisher =
                    game.publisher ||
                    catalogGame?.publisher ||
                    "Game";


                const logo =
                    game.logo ||
                    catalogGame?.logo ||
                    "../images/logo/logo.png";


                const appLink =
                    game.appLink ||
                    game.link ||
                    catalogGame?.appLink ||
                    "";


                const webLink =
                    game.webLink ||
                    game.url ||
                    catalogGame?.webLink ||
                    "";


                /* =========================================
                   CARD
                ========================================= */

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "game-card";


                card.dataset.gameId =
                    gameId || "";


                card.innerHTML = `

                    <!-- REMOVE -->

                    <button
                        type="button"
                        class="remove-game-btn"
                        title="Remove Game"
                        data-game-id="${escapeHtml(gameId)}"
                    >

                        <i
                            class="fa-solid fa-xmark"
                        ></i>

                    </button>


                    <!-- GAME LOGO -->

                    <div class="game-icon">

                        <img
                            src="${escapeHtml(logo)}"
                            alt="${escapeHtml(gameName)}"
                            loading="lazy"
                        >

                    </div>


                    <!-- GAME INFO -->

                    <div class="game-info">

                        <h3>
                            ${escapeHtml(gameName)}
                        </h3>

                        <p>
                            ${escapeHtml(publisher)}
                        </p>

                    </div>


                    <!-- OPEN -->

                    <div class="game-action">

                        <button
                            type="button"
                            class="open-game-btn"
                            data-app-link="${escapeHtml(appLink)}"
                            data-web-link="${escapeHtml(webLink)}"
                        >

                            <i
                                class="fa-solid fa-play"
                            ></i>

                            Open Game

                        </button>

                    </div>

                `;


                /* =========================================
                   LOGO ERROR
                ========================================= */

                const image =
                    card.querySelector(
                        ".game-icon img"
                    );


                if (image) {

                    image.addEventListener(
                        "error",
                        function () {

                            /*
                             * Agar local game logo
                             * missing hai to 4FU logo
                             * show hoga.
                             */

                            this.src =
                                "../images/logo/logo.png";

                        }
                    );

                }


                /* =========================================
                   OPEN GAME
                ========================================= */

                const openButton =
                    card.querySelector(
                        ".open-game-btn"
                    );


                if (openButton) {

                    openButton.addEventListener(
                        "click",
                        function () {

                            openGame(

                                this.dataset.appLink,

                                this.dataset.webLink

                            );

                        }
                    );

                }


                /* =========================================
                   REMOVE GAME
                ========================================= */

                const removeButton =
                    card.querySelector(
                        ".remove-game-btn"
                    );


                if (removeButton) {

                    removeButton.addEventListener(
                        "click",
                        function () {

                            removeGame(
                                gameId
                            );

                        }
                    );

                }


                container.appendChild(
                    card
                );

            }
        );


        /* =========================================
           OWNER DELETE VISIBILITY
        ========================================= */

        updateRemoveButtons();

    }


    /* =========================================================
       OPEN GAME
    ========================================================= */

    function openGame(
        appLink,
        webLink
    ) {

        /*
         * App link available nahi hai
         */

        if (!appLink) {

            if (webLink) {

                window.open(
                    webLink,
                    "_blank"
                );

            }

            return;

        }


        let appOpened =
            false;


        /* =========================================
           DETECT PAGE HIDDEN / APP OPENED
        ========================================= */

        const onVisibility =
            () => {

                if (
                    document.hidden
                ) {

                    appOpened =
                        true;

                }

            };


        document.addEventListener(
            "visibilitychange",
            onVisibility
        );


        /* =========================================
           OPEN APP
        ========================================= */

        window.location.href =
            appLink;


        /* =========================================
           FALLBACK
        ========================================= */

        setTimeout(
            () => {

                document.removeEventListener(
                    "visibilitychange",
                    onVisibility
                );


                if (
                    !appOpened &&
                    webLink
                ) {

                    window.location.href =
                        webLink;

                }

            },
            1800
        );

    }


    /* =========================================================
       REMOVE GAME
    ========================================================= */

    async function removeGame(
        gameId
    ) {

        if (!gameId) {

            return;

        }


        const user =
            auth.currentUser;


        if (!user) {

            alert(
                "Please login first."
            );

            return;

        }


        try {

            /* =========================================
               PLAYER
            ========================================= */

            const playerDoc =
                await db
                    .collection("players")
                    .doc(playerKey)
                    .get();


            if (!playerDoc.exists) {

                alert(
                    "Player not found."
                );

                return;

            }


            const player =
                playerDoc.data();


            /* =========================================
               OWNER CHECK
            ========================================= */

            if (
                !player.loginEmail ||
                !user.email ||
                player.loginEmail
                    .toLowerCase() !==
                user.email
                    .toLowerCase()
            ) {

                alert(
                    "You can only remove games from your own profile."
                );

                return;

            }


            /* =========================================
               CONFIRM
            ========================================= */

            const confirmed =
                confirm(
                    "Remove this game from your profile?"
                );


            if (!confirmed) {

                return;

            }


            /* =========================================
               FILTER
            ========================================= */

            const games =
                Array.isArray(
                    player.games
                )
                    ? player.games
                    : [];


            const updatedGames =
                games.filter(
                    (game) => {

                        const id =
                            game.id ||
                            game.gameId ||
                            game.key;


                        return id !== gameId;

                    }
                );


            /* =========================================
               SAVE
            ========================================= */

            await db
                .collection("players")
                .doc(playerKey)
                .update({

                    games:
                        updatedGames

                });


            /* =========================================
               UPDATE UI
            ========================================= */

            renderPlayerGames(
                updatedGames
            );


        }

        catch (error) {

            console.error(
                "Remove game error:",
                error
            );


            alert(
                "Unable to remove game.\n\n" +
                error.message
            );

        }

    }


    /* =========================================================
       REMOVE BUTTON VISIBILITY
    ========================================================= */

    function updateRemoveButtons() {

        const user =
            auth.currentUser;


        if (!user) {

            document
                .querySelectorAll(
                    ".remove-game-btn"
                )
                .forEach(
                    (button) => {

                        button.style.display =
                            "none";

                    }
                );

            return;

        }


        db.collection("players")
            .doc(playerKey)
            .get()

            .then((doc) => {

                if (!doc.exists) {

                    return;

                }


                const player =
                    doc.data();


                const isOwner =
                    player.loginEmail &&
                    user.email &&
                    player.loginEmail
                        .toLowerCase() ===
                    user.email
                        .toLowerCase();


                document
                    .querySelectorAll(
                        ".remove-game-btn"
                    )
                    .forEach(
                        (button) => {

                            button.style.display =
                                isOwner
                                    ? "flex"
                                    : "none";

                        }
                    );

            })

            .catch(
                (error) => {

                    console.error(
                        "Owner check error:",
                        error
                    );

                }
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
                    weaponCard
                        .getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                const moveX =
                    (
                        x -
                        rect.width / 2
                    ) / 20;


                const moveY =
                    (
                        y -
                        rect.height / 2
                    ) / 20;


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
       INITIALIZE GAME CENTER
    ========================================================= */

    function initGameCenter() {

        loadGameDropdown();

        initAddGame();

        updateRemoveButtons();

    }


    /* =========================================================
       DOM READY
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                initGameCenter();

                initWeaponParallax();

            }
        );

    }

    else {

        initGameCenter();

        initWeaponParallax();

    }


})();