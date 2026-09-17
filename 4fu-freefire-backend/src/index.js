const API_BASE = "http://siambhau69.eu.cc/freefireinfo";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

async function fetchJSON(url) {
    const response = await fetch(url);
    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Invalid API response. HTTP ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.message ||
            `Free Fire API returned HTTP ${response.status}`
        );
    }

    return data;
}

// Reads a metric even when the upstream API puts detailedstats inside
// an array or one/more wrapper objects. It only returns the first
// matching metric and does not sum nested duplicates.
function findMetric(root, names) {
    const wanted = new Set(names.map(name => String(name).toLowerCase()));
    const seen = new Set();

    function walk(value) {
        if (!value || typeof value !== "object" || seen.has(value)) return undefined;
        seen.add(value);

        // Prefer direct properties on the current object.
        for (const [key, val] of Object.entries(value)) {
            if (
                wanted.has(String(key).toLowerCase()) &&
                val !== undefined &&
                val !== null &&
                val !== "" &&
                !Number.isNaN(Number(val))
            ) {
                return Number(val);
            }
        }

        // Then inspect nested objects/arrays.
        for (const child of Object.values(value)) {
            if (child && typeof child === "object") {
                const found = walk(child);
                if (found !== undefined) return found;
            }
        }

        return undefined;
    }

    return walk(root);
}

function calculateMode(mode) {
    if (!mode || typeof mode !== "object") return null;

    const matches = findMetric(mode, [
        "gamesplayed", "gamesPlayed", "matches", "totalMatches"
    ]) ?? 0;

    const wins = findMetric(mode, [
        "wins", "win", "booyah", "totalWins"
    ]) ?? 0;

    const kills = findMetric(mode, [
        "kills", "totalKills"
    ]) ?? 0;

    // Some versions of the API do not expose deaths as a direct mode
    // field. For BR career data, matches - wins gives the number of
    // non-winning games, which is the value used by this API's stats.
    const apiDeaths = findMetric(mode, [
        "deaths", "totalDeaths"
    ]);
    const deaths = apiDeaths ?? Math.max(0, matches - wins);

    const headshots = findMetric(mode, [
        "headshots", "headshot", "totalHeadshots", "headshotCount"
    ]) ?? 0;

    const headshotKills = findMetric(mode, [
        "headshotkills", "headshotKills", "headshot_kills",
        "totalHeadshotKills", "headshotKill", "headshotKillCount"
    ]) ?? 0;

    return {
        matches,
        wins,
        kills,
        deaths,
        headshots,
        headshotKills,
    };
}

function calculateStats(stats) {
    const modeStats = {
        solo: calculateMode(stats?.solostats),
        duo: calculateMode(stats?.duostats),
        squad: calculateMode(stats?.quadstats),
    };

    let matches = 0;
    let wins = 0;
    let kills = 0;
    let deaths = 0;
    let headshots = 0;
    let headshotKills = 0;

    for (const mode of Object.values(modeStats)) {
        if (!mode) continue;
        matches += mode.matches;
        wins += mode.wins;
        kills += mode.kills;
        deaths += mode.deaths;
        headshots += mode.headshots;
        headshotKills += mode.headshotKills;
    }

    const kd = deaths > 0 ? Number((kills / deaths).toFixed(2)) : 0;
    const headshotRate = kills > 0
        ? Number(((headshotKills / kills) * 100).toFixed(2))
        : 0;
    const booyahRate = matches > 0
        ? Number(((wins / matches) * 100).toFixed(2))
        : 0;

    return {
        matches,
        wins,
        kills,
        deaths,
        headshots,
        headshotKills,
        kd,
        headshotRate,
        booyahRate,
        modeStats,
    };
}

export default {
    async fetch(request, env) {
        const headers = corsHeaders();

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers });
        }

        if (request.method !== "GET") {
            return new Response(
                JSON.stringify({ success: false, message: "Method not allowed" }),
                {
                    status: 405,
                    headers: { ...headers, "Content-Type": "application/json" },
                }
            );
        }

        try {
            const url = new URL(request.url);
            const uid = (url.searchParams.get("uid") || "").trim();
            const region = (url.searchParams.get("region") || "IND")
                .trim()
                .toUpperCase();

            if (!uid) {
                return new Response(
                    JSON.stringify({ success: false, message: "UID is required" }),
                    { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
                );
            }

            if (!/^\d{5,15}$/.test(uid)) {
                return new Response(
                    JSON.stringify({ success: false, message: "Invalid UID" }),
                    { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
                );
            }

            const allowedRegions = [
                "IND", "SG", "BR", "BD", "ID", "TH", "ME",
                "PK", "US", "VN", "TW", "RU", "CIS",
            ];

            if (!allowedRegions.includes(region)) {
                return new Response(
                    JSON.stringify({ success: false, message: "Unsupported region" }),
                    { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
                );
            }

            if (!env.FREE_FIRE_API_KEY) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: "FREE_FIRE_API_KEY is not configured",
                    }),
                    { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
                );
            }

            const encodedUID = encodeURIComponent(uid);
            const encodedRegion = encodeURIComponent(region);
            const key = encodeURIComponent(env.FREE_FIRE_API_KEY);

            const profileURL =
                `${API_BASE}/bhau?uid=${encodedUID}&region=${encodedRegion}&key=${key}`;

            const statsURL =
                `${API_BASE}/stats?uid=${encodedUID}&region=${encodedRegion}` +
                `&gamemode=br&matchmode=CAREER&key=${key}`;

            console.log(`[4FU] Fetching Free Fire player ${uid} (${region})`);

            const [profileData, statsData] = await Promise.all([
                fetchJSON(profileURL),
                fetchJSON(statsURL),
            ]);

            const calculatedStats = calculateStats(statsData?.stats);
            const basic = profileData?.basicInfo || {};
            const clan = profileData?.clanBasicInfo || {};
            const social = profileData?.socialInfo || {};

            const result = {
                success: true,
                uid,
                region,
                name: basic.nickname || null,
                level: basic.level ?? null,
                rank: basic.rank ?? null,
                rankingPoints: basic.rankingPoints ?? null,
                csRank: basic.csRank ?? null,
                csRankingPoints: basic.csRankingPoints ?? null,
                likes: basic.liked ?? null,
                guild: clan.clanName || null,
                guildId: clan.clanId || null,
                language: social.language || null,
                gender: social.gender || null,
                profileInfo: profileData?.profileInfo || null,
                petInfo: profileData?.petInfo || null,
                stats: calculatedStats,
                modeStats: calculatedStats.modeStats,
                rawProfile: profileData,
                rawStats: statsData,
            };

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=60",
                },
            });
        } catch (error) {
            console.error("[4FU] Worker error:", error);

            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Free Fire API request failed",
                    error: error?.message || String(error),
                }),
                {
                    status: 502,
                    headers: { ...headers, "Content-Type": "application/json" },
                }
            );
        }
    },
};
