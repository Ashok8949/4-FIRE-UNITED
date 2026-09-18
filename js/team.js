/* =========================================================
   4 FIRE UNITED - TEAM PAGE + LIVE FREE FIRE API
   Existing Firestore data is kept as fallback.
   ========================================================= */

(function () {
    "use strict";

    const team = document.getElementById("team-grid");
    if (!team) return;

    const escapeHtml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const number = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    };

    const pick = (...values) => values.find(v =>
        v !== undefined && v !== null && v !== ""
    );

    function getLiveValues(data) {
        const basic = data?.basicInfo || data?.basic_info || data?.profile || data || {};
        const stats = data?.stats || data?.playerStats || data?.statistics || {};

        const level = pick(basic.level, data?.level);
        const name = pick(basic.nickname, basic.name, data?.name, data?.nickname);
        const kd = pick(stats.kd, stats.kdRatio, data?.kd);
        const headshot = pick(
            stats.headshotRate,
            stats.headshotPercentage,
            stats.headshot,
            data?.headshotRate,
            data?.headshot
        );
        const rank = pick(
            basic.rankName,
            data?.rankName
        );

        return { name, level, kd, headshot, rank };
    }

    function hasLiveValue(value) {
        return value !== undefined && value !== null && value !== "";
    }

    db.collection("players")
        .get()
        .then(async (snapshot) => {

            const allPlayers = [];

            snapshot.forEach((doc) => {
                allPlayers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Owner hamesha first, then displayOrder, then createdAt.
            allPlayers.sort((a, b) => {
                if (a.owner === true) return -1;
                if (b.owner === true) return 1;

                const orderA = Number(a.displayOrder || 9999);
                const orderB = Number(b.displayOrder || 9999);

                if (orderA !== orderB) return orderA - orderB;

                const createA = a.createdAt?.toMillis
                    ? a.createdAt.toMillis()
                    : new Date(a.createdAt || 0).getTime();
                const createB = b.createdAt?.toMillis
                    ? b.createdAt.toMillis()
                    : new Date(b.createdAt || 0).getTime();

                return createA - createB;
            });

            // Pehle Firestore cards render karo, taaki API slow/error hone par page blank na rahe.
            team.innerHTML = allPlayers.map((p) => `
                <div class="team-card ${p.owner ? 'owner-card' : ''}" data-player-id="${escapeHtml(p.id)}">
                    <div class="player-image">
                        <img src="${escapeHtml(p.image || 'images/logo/logo.png')}" alt="${escapeHtml(p.ign || p.name || 'Player')}">
                        ${p.owner ? `
                            <div class="owner-crown">
                                <i class="fa-solid fa-crown"></i>
                            </div>
                        ` : ""}
                    </div>

                    <div class="team-info">
                        <div class="owner-name">
                            ${p.owner ? `
                                <span class="owner-tag">
                                    <i class="fa-solid fa-crown"></i>
                                    TEAM OWNER
                                </span>
                            ` : ""}
                            <h2 class="team-player-name">${escapeHtml(p.ign || p.name || "Player")}</h2>
                        </div>

                        <span>${escapeHtml(p.role || "")}</span>

                        <div class="mini-stats">
                            <p class="team-level">❤️ Level ${escapeHtml(p.level || "-")}</p>
                            <p class="team-headshot">🎯 HS ${escapeHtml(p.headshot || "-")}</p>
                            <p class="team-kd">⚔️ KD ${escapeHtml(p.kd || "-")}</p>
                        </div>

                        <a href="players/player.html?id=${encodeURIComponent(p.id)}" class="btn1">
                            View Profile
                        </a>
                    </div>
                </div>
            `).join("");

            // Live API values update only the fields already present on the Team cards.
            // Firestore values remain as fallback if the API fails or has no value.
            if (typeof window.getFreeFirePlayer !== "function") {
                console.warn("[4FU] freeFireService.js is not loaded. Firestore fallback remains active.");
                return;
            }

            await Promise.all(allPlayers.map(async (p) => {
                if (!p.uid) return;

                try {
                    const liveData = await window.getFreeFirePlayer(
                        p.uid,
                        p.region || "IND"
                    );

                    if (!liveData) return;

                    const live = getLiveValues(liveData);
                    const card = team.querySelector(`[data-player-id="${CSS.escape(String(p.id))}"]`);
                    if (!card) return;

                    const nameEl = card.querySelector(".team-player-name");
                    const levelEl = card.querySelector(".team-level");
                    const hsEl = card.querySelector(".team-headshot");
                    const kdEl = card.querySelector(".team-kd");

                    if (hasLiveValue(live.name) && nameEl) {
                        nameEl.textContent = live.name;
                    }
                    if (hasLiveValue(live.level) && levelEl) {
                        levelEl.textContent = `❤️ Level ${live.level}`;
                    }
                    if (hasLiveValue(live.headshot) && hsEl) {
                        hsEl.textContent = `🎯 HS ${live.headshot}`;
                    }
                    if (hasLiveValue(live.kd) && kdEl) {
                        const kdNumber = number(live.kd);
                        kdEl.textContent = `⚔️ KD ${kdNumber !== null ? kdNumber.toFixed(2) : live.kd}`;
                    }

                    card.dataset.liveSync = "true";
                } catch (error) {
                    // API fail => existing Firestore values stay visible.
                    console.warn(`[4FU] Live API failed for ${p.uid}; using Firestore fallback.`, error);
                }
            }));

            console.info("[4FU] Team page live API sync complete.");
        })
        .catch((error) => {
            console.error("Firestore Error:", error);
            team.innerHTML = `<p style="width:100%;text-align:center;color:#999;">Unable to load team.</p>`;
        });
})();
