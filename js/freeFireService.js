/*
 * 4FU - Free Fire Live Data Service
 * Uses the 4FU Cloudflare Worker.
 * No private API key is stored here.
 */

(function () {
    "use strict";

    const FREE_FIRE_API_BASE_URL =
        "https://4fu-freefire-backend.4fu-freefire.workers.dev";

    const REQUEST_TIMEOUT_MS = 10000;

    function firstValue(...values) {
        return values.find(
            value =>
                value !== undefined &&
                value !== null &&
                value !== ""
        );
    }

    async function getFreeFirePlayer(uid, region) {
        if (!uid) return null;

        const url = new URL(FREE_FIRE_API_BASE_URL);
        url.searchParams.set("uid", String(uid));
        url.searchParams.set(
            "region",
            String(region || "IND").toUpperCase()
        );

        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT_MS
        );

        try {
            console.info("[4FU] Fetching Free Fire live data...");

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store",
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(
                    `Free Fire API returned HTTP ${response.status}`
                );
            }

            const data = await response.json();

            if (!data || typeof data !== "object") {
                throw new Error("Invalid Free Fire API response.");
            }

            /* Normalize the Worker response without removing raw API data. */
            const liveGuild = firstValue(
                data.guild,
                data.clanName,
                data.clan,
                data.clanBasicInfo?.clanName,
                data.clanBasicInfo?.name,
                data.clan_basic_info?.clanName,
                data.clan_basic_info?.name,
                data.rawProfile?.clanBasicInfo?.clanName,
                data.rawProfile?.clanBasicInfo?.name,
                data.rawProfile?.clan?.clanName,
                data.rawProfile?.clan?.name,
                data.rawAccount?.clanBasicInfo?.clanName,
                data.rawAccount?.clanBasicInfo?.name,
                data.rawAccount?.clan?.clanName,
                data.rawAccount?.clan?.name
            );

            const result = {
                ...data,

                basicInfo: {
                    ...(data.basicInfo || {}),
                    accountId: firstValue(
                        data.basicInfo?.accountId,
                        data.uid,
                        uid
                    ),
                    nickname: firstValue(
                        data.basicInfo?.nickname,
                        data.nickname,
                        data.name
                    ),
                    level: firstValue(
                        data.basicInfo?.level,
                        data.level
                    ),
                    rank: firstValue(
                        data.basicInfo?.rank,
                        data.rankName,
                        data.rank
                    ),
                    region: firstValue(
                        data.basicInfo?.region,
                        data.region,
                        region || "IND"
                    )
                },

                stats: {
                    ...(data.stats || {}),
                    matches: firstValue(
                        data.stats?.matches,
                        data.matches
                    ),
                    wins: firstValue(
                        data.stats?.wins,
                        data.wins
                    ),
                    kills: firstValue(
                        data.stats?.kills,
                        data.kills
                    ),
                    deaths: firstValue(
                        data.stats?.deaths,
                        data.deaths
                    ),
                    kd: firstValue(
                        data.stats?.kd,
                        data.kd
                    ),
                    headshot: firstValue(
                        data.stats?.headshot,
                        data.stats?.headshotRate,
                        data.headshot,
                        data.headshotRate
                    ),
                    headshotKills: firstValue(
                        data.stats?.headshotKills,
                        data.headshotKills
                    ),
                    headshots: firstValue(
                        data.stats?.headshots,
                        data.headshots
                    ),
                    booyahRate: firstValue(
                        data.stats?.booyahRate,
                        data.booyahRate
                    )
                },

                clanBasicInfo: liveGuild
                    ? {
                        ...(data.clanBasicInfo || {}),
                        clanName: liveGuild,
                        clanId: firstValue(
                            data.guildId,
                            data.clanBasicInfo?.clanId,
                            data.rawProfile?.clanBasicInfo?.clanId,
                            data.rawProfile?.clan?.clanId
                        )
                    }
                    : (
                        data.clanBasicInfo ||
                        data.clan_basic_info ||
                        null
                    )
            };

            console.info(
                "[4FU] Free Fire live data received:",
                result
            );

            return result;

        } finally {
            clearTimeout(timeout);
        }
    }

    window.getFreeFirePlayer = getFreeFirePlayer;

})();
