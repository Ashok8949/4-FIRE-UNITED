// ============================================================
// 4FU AUTO TOURNAMENT ADDER
// Admin only pastes a YouTube link.
// Metadata is fetched from the 4FU YouTube Worker automatically.
// ============================================================

const FOUR_FU_YOUTUBE_WORKER =
    "https://4fu-freefire-backend.4fu-freefire-backend.workers.dev";

const FOUR_FU_ANDROID_FCM_URL =
    "https://script.google.com/macros/s/AKfycbyazs42LLtr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec";

const liveLinkInput = document.getElementById("liveLink");
const saveButton = document.getElementById("saveTournament");
const preview = document.getElementById("autoPreview");

let latestYouTubeInfo = null;
let previewTimer = null;

// ============================================================
// YouTube Video ID
// ============================================================

function extractYouTubeVideoId(value) {

    const url = String(value || "").trim();

    if (!url) return null;

    // Direct video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    try {
        const parsed = new URL(url);

        // youtube.com/watch?v=VIDEO_ID
        const watchId = parsed.searchParams.get("v");
        if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) {
            return watchId;
        }

        // youtu.be/VIDEO_ID
        if (parsed.hostname.includes("youtu.be")) {
            const id = parsed.pathname.split("/").filter(Boolean)[0];
            if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
                return id;
            }
        }

        // youtube.com/live/VIDEO_ID
        // youtube.com/embed/VIDEO_ID
        const parts = parsed.pathname.split("/").filter(Boolean);
        const markerIndex = parts.findIndex(part =>
            ["live", "embed", "shorts"].includes(part.toLowerCase())
        );

        if (markerIndex !== -1) {
            const id = parts[markerIndex + 1];
            if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
                return id;
            }
        }

    } catch (error) {
        // Not a valid URL; handled below.
    }

    return null;
}

// ============================================================
// Helpers
// ============================================================

function formatIndiaDateTime(isoString) {

    if (!isoString) {
        return {
            date: "",
            time: ""
        };
    }

    const dateObject = new Date(isoString);

    if (Number.isNaN(dateObject.getTime())) {
        return {
            date: "",
            time: ""
        };
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).formatToParts(dateObject);

    const get = type =>
        parts.find(part => part.type === type)?.value || "";

    return {
        date: `${get("year")}-${get("month")}-${get("day")}`,
        time: `${get("hour")}:${get("minute")}`
    };
}

function formatDisplayDateTime(isoString) {

    if (!isoString) return "Time not available";

    const dateObject = new Date(isoString);

    if (Number.isNaN(dateObject.getTime())) {
        return "Time not available";
    }

    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(dateObject);
}

function detectGame(title, description) {

    const text = `${title || ""} ${description || ""}`.toLowerCase();

    if (
        text.includes("free fire max") ||
        text.includes("ffmic") ||
        text.includes("freefire")
    ) {
        return "Free Fire MAX";
    }

    if (text.includes("free fire")) {
        return "Free Fire";
    }

    // 4FU is a Free Fire esports site, so use this sensible default
    // if YouTube does not explicitly mention the game.
    return "Free Fire MAX";
}

function detectMode(title, description) {

    const text = `${title || ""} ${description || ""}`.toLowerCase();

    if (
        text.includes("clash squad") ||
        /\bcs\b/.test(text)
    ) {
        return "Clash Squad";
    }

    if (
        text.includes("battle royale") ||
        /\bbr\b/.test(text)
    ) {
        return "Battle Royale";
    }

    if (
        text.includes("1v1") ||
        text.includes("1 v 1")
    ) {
        return "1v1";
    }

    if (
        text.includes("2v2") ||
        text.includes("2 v 2")
    ) {
        return "2v2";
    }

    if (
        text.includes("4v4") ||
        text.includes("4 v 4")
    ) {
        return "4v4";
    }

    return "Live Tournament";
}

function statusLabel(status) {

    switch (String(status || "").toUpperCase()) {
        case "LIVE":
            return "Live";

        case "UPCOMING":
            return "Upcoming";

        case "ENDED":
            return "Ended";

        default:
            return "Upcoming";
    }
}

function getBestTournamentTime(info) {

    if (info.status === "LIVE" && info.actualStartTime) {
        return info.actualStartTime;
    }

    if (info.status === "ENDED" && info.actualStartTime) {
        return info.actualStartTime;
    }

    return (
        info.scheduledStartTime ||
        info.actualStartTime ||
        info.publishedAt ||
        null
    );
}

function setPreview(info) {

    latestYouTubeInfo = info;

    const previewThumbnail =
        document.getElementById("previewThumbnail");

    const previewTitle =
        document.getElementById("previewTitle");

    const previewChannel =
        document.getElementById("previewChannel");

    const previewDate =
        document.getElementById("previewDate");

    const previewGame =
        document.getElementById("previewGame");

    const previewStatus =
        document.getElementById("previewStatus");

    const dot =
        previewStatus.querySelector(".auto-dot");

    const statusText =
        previewStatus.querySelector("span:last-child");

    previewThumbnail.src =
        info.thumbnail ||
        `https://i.ytimg.com/vi/${info.videoId}/hqdefault.jpg`;

    previewTitle.textContent =
        info.title || "YouTube Tournament";

    previewChannel.textContent =
        `Channel: ${info.channelTitle || "YouTube"}`;

    const bestTime = getBestTournamentTime(info);

    previewDate.textContent =
        `Broadcast: ${formatDisplayDateTime(bestTime)}`;

    previewGame.textContent =
        `Game: ${detectGame(info.title, info.description)}`;

    statusText.textContent =
        statusLabel(info.status);

    dot.classList.toggle(
        "live",
        String(info.status).toUpperCase() === "LIVE"
    );

    preview.classList.add("show");
}

// ============================================================
// Fetch YouTube data from Worker
// ============================================================

async function fetchYouTubeInfo(videoId) {

    const endpoint =
        `${FOUR_FU_YOUTUBE_WORKER}/?youtubeLive=1&videoId=${encodeURIComponent(videoId)}`;

    const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `YouTube Worker returned HTTP ${response.status}`
        );
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error(
            data.error || "Unable to fetch YouTube data."
        );
    }

    return data;
}

// ============================================================
// Preview on paste / blur
// ============================================================

async function loadPreview() {

    const value = liveLinkInput.value.trim();

    if (!value) {
        preview.classList.remove("show");
        latestYouTubeInfo = null;
        return;
    }

    const videoId = extractYouTubeVideoId(value);

    if (!videoId) {
        preview.classList.remove("show");
        latestYouTubeInfo = null;
        return;
    }

    try {

        preview.classList.add("show");

        document.getElementById("previewTitle").textContent =
            "Fetching YouTube data...";

        document.getElementById("previewChannel").textContent =
            "";

        document.getElementById("previewDate").textContent =
            "";

        document.getElementById("previewGame").textContent =
            "";

        await new Promise(resolve => setTimeout(resolve, 0));

        const info = await fetchYouTubeInfo(videoId);

        setPreview(info);

    } catch (error) {

        console.error(
            "4FU YouTube preview error:",
            error
        );

        latestYouTubeInfo = null;

        document.getElementById("previewTitle").textContent =
            "Unable to fetch YouTube data";

        document.getElementById("previewChannel").textContent =
            error.message || "Check the YouTube link.";

        document.getElementById("previewDate").textContent = "";
        document.getElementById("previewGame").textContent = "";
    }
}

liveLinkInput.addEventListener("input", () => {

    clearTimeout(previewTimer);

    previewTimer = setTimeout(
        loadPreview,
        650
    );
});

liveLinkInput.addEventListener("blur", loadPreview);

// ============================================================
// Android FCM Notification
// ============================================================

function send4FUTournamentNotification(tournament) {

    try {

        fetch(FOUR_FU_ANDROID_FCM_URL, {

            method: "POST",
            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify({

                type: "major",
                updateType: "tournament",
                priority: "normal",

                title: "🏆 New Tournament Added",

                body:
                    `${tournament.title} has been added to 4 FIRE UNITED.`,

                link: "/tournaments.html",

                targetPlayerId: "ALL",

                senderEmail:
                    auth.currentUser?.email || "Admin"

            })

        }).catch(error => {

            console.warn(
                "4FU ANDROID FCM TOURNAMENT ERROR:",
                error
            );

        });

    } catch (error) {

        console.warn(
            "4FU ANDROID FCM TOURNAMENT ERROR:",
            error
        );

    }
}

// ============================================================
// Save Tournament
// ============================================================

saveButton.addEventListener("click", async () => {

    const youtubeUrl =
        liveLinkInput.value.trim();

    const videoId =
        extractYouTubeVideoId(youtubeUrl);

    if (!videoId) {

        alert(
            "❌ Please paste a valid YouTube Live / Watch link."
        );

        liveLinkInput.focus();

        return;
    }

    const originalButtonHTML =
        saveButton.innerHTML;

    saveButton.disabled = true;

    saveButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Fetching YouTube...';

    try {

        // Always fetch fresh data before saving.
        // This prevents stale preview data.
        const info =
            await fetchYouTubeInfo(videoId);

        const bestTime =
            getBestTournamentTime(info);

        const dateTime =
            formatIndiaDateTime(bestTime);

        const game =
            detectGame(
                info.title,
                info.description
            );

        const mode =
            detectMode(
                info.title,
                info.description
            );

        const tournament = {

            // Existing tournament fields
            title:
                info.title ||
                "YouTube Tournament",

            game,

            mode,

            date:
                dateTime.date,

            time:
                dateTime.time,

            // These are not available from YouTube.
            // Keep safe defaults instead of asking admin.
            prize:
                "Not announced",

            registration:
                "",

            status:
                statusLabel(info.status),

            liveLink:
                info.watchUrl ||
                `https://www.youtube.com/watch?v=${videoId}`,

            liveStatus:
                statusLabel(info.status),

            // YouTube automatic metadata
            youtubeVideoId:
                info.videoId || videoId,

            youtubeTitle:
                info.title || "",

            youtubeDescription:
                info.description || "",

            youtubeChannelId:
                info.channelId || "",

            youtubeChannelTitle:
                info.channelTitle || "",

            youtubeThumbnail:
                info.thumbnail || "",

            youtubeStatus:
                info.status || "UNKNOWN",

            youtubeScheduledStartTime:
                info.scheduledStartTime || null,

            youtubeScheduledEndTime:
                info.scheduledEndTime || null,

            youtubeActualStartTime:
                info.actualStartTime || null,

            youtubeActualEndTime:
                info.actualEndTime || null,

            youtubeConcurrentViewers:
                info.concurrentViewers ?? null,

            youtubeViewCount:
                info.viewCount ?? null,

            youtubeLikeCount:
                info.likeCount ?? null,

            youtubeDuration:
                info.duration || "",

            youtubePrivacyStatus:
                info.privacyStatus || "",

            youtubeEmbeddable:
                info.embeddable !== false,

            youtubeWatchUrl:
                info.watchUrl ||
                `https://www.youtube.com/watch?v=${videoId}`,

            youtubeEmbedUrl:
                info.embedUrl ||
                `https://www.youtube.com/embed/${videoId}`,

            youtubeFetchedAt:
                info.fetchedAt ||
                new Date().toISOString(),

            createdAt:
                firebase.firestore.FieldValue.serverTimestamp(),

            updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()

        };

        saveButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving Tournament...';

        const docRef =
            await db.collection("tournaments")
                .add(tournament);

        // Existing in-dashboard notification
        await db.collection("notifications").add({

            title:
                "New Tournament Added",

            message:
                tournament.title,

            type:
                "tournament",

            link:
                "tournaments.html",

            tournamentId:
                docRef.id,

            isRead:
                false,

            createdAt:
                firebase.firestore.FieldValue.serverTimestamp()

        });

        // Existing Android notification
        send4FUTournamentNotification(
            tournament
        );

        alert(
            `✅ Tournament Added Successfully!\n\n${tournament.title}`
        );

        window.location.href =
            "tournaments.html";

    } catch (error) {

        console.error(
            "4FU AUTO TOURNAMENT ERROR:",
            error
        );

        saveButton.disabled = false;

        saveButton.innerHTML =
            originalButtonHTML;

        alert(
            "❌ Tournament add failed.\n\n" +
            (error.message || "Unknown error")
        );
    }
});
