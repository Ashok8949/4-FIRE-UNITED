// ============================================================
// 4FU AUTO EDIT TOURNAMENT
// Existing tournament -> load YouTube link -> fetch fresh data
// -> update Firestore automatically.
// ============================================================

const params = new URLSearchParams(window.location.search);
const tournamentId = params.get("id");

if (!tournamentId) {

    alert("Tournament ID Missing!");
    window.location.href = "tournaments.html";

}

const docRef =
    db.collection("tournaments").doc(tournamentId);

const FOUR_FU_YOUTUBE_WORKER =
    "https://4fu-freefire-backend.4fu-freefire-backend.workers.dev";

const FOUR_FU_ANDROID_FCM_URL =
    "https://script.google.com/macros/s/AKfycbyazs42LLtr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec";

const liveLinkInput =
    document.getElementById("liveLink");

const updateButton =
    document.getElementById("updateTournament");

let currentTournament = null;
let latestYouTubeInfo = null;
let previewTimer = null;

// ============================================================
// YouTube Video ID
// ============================================================

function extractYouTubeVideoId(value) {

    const url = String(value || "").trim();

    if (!url) return null;

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    try {

        const parsed = new URL(url);

        const watchId =
            parsed.searchParams.get("v");

        if (
            watchId &&
            /^[a-zA-Z0-9_-]{11}$/.test(watchId)
        ) {
            return watchId;
        }

        if (parsed.hostname.includes("youtu.be")) {

            const id =
                parsed.pathname
                    .split("/")
                    .filter(Boolean)[0];

            if (
                id &&
                /^[a-zA-Z0-9_-]{11}$/.test(id)
            ) {
                return id;
            }

        }

        const parts =
            parsed.pathname
                .split("/")
                .filter(Boolean);

        const markerIndex =
            parts.findIndex(part =>
                ["live", "embed", "shorts"].includes(
                    part.toLowerCase()
                )
            );

        if (markerIndex !== -1) {

            const id =
                parts[markerIndex + 1];

            if (
                id &&
                /^[a-zA-Z0-9_-]{11}$/.test(id)
            ) {
                return id;
            }

        }

    } catch (error) {
        // Invalid URL handled below.
    }

    return null;
}

// ============================================================
// Date helpers
// ============================================================

function formatIndiaDateTime(isoString) {

    if (!isoString) {
        return {
            date: "",
            time: ""
        };
    }

    const dateObject =
        new Date(isoString);

    if (Number.isNaN(dateObject.getTime())) {
        return {
            date: "",
            time: ""
        };
    }

    const parts =
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).formatToParts(dateObject);

    const get =
        type =>
            parts.find(
                part => part.type === type
            )?.value || "";

    return {
        date:
            `${get("year")}-${get("month")}-${get("day")}`,

        time:
            `${get("hour")}:${get("minute")}`
    };
}

function formatDisplayDateTime(isoString) {

    if (!isoString) {
        return "Time not available";
    }

    const dateObject =
        new Date(isoString);

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

// ============================================================
// Automatic detection
// ============================================================

function detectGame(title, description) {

    const text =
        `${title || ""} ${description || ""}`
            .toLowerCase();

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

    return "Free Fire MAX";
}

function detectMode(title, description) {

    const text =
        `${title || ""} ${description || ""}`
            .toLowerCase();

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

    switch (
        String(status || "").toUpperCase()
    ) {

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

    if (
        info.status === "LIVE" &&
        info.actualStartTime
    ) {
        return info.actualStartTime;
    }

    if (
        info.status === "ENDED" &&
        info.actualStartTime
    ) {
        return info.actualStartTime;
    }

    return (
        info.scheduledStartTime ||
        info.actualStartTime ||
        info.publishedAt ||
        null
    );
}

// ============================================================
// Preview
// ============================================================

function setPreview(info) {

    latestYouTubeInfo = info;

    const preview =
        document.getElementById("autoPreview");

    const thumbnail =
        document.getElementById("previewThumbnail");

    const title =
        document.getElementById("previewTitle");

    const channel =
        document.getElementById("previewChannel");

    const date =
        document.getElementById("previewDate");

    const game =
        document.getElementById("previewGame");

    const status =
        document.getElementById("previewStatus");

    const dot =
        status.querySelector(".auto-dot");

    const statusText =
        status.querySelector("span:last-child");

    thumbnail.src =
        info.thumbnail ||
        `https://i.ytimg.com/vi/${info.videoId}/hqdefault.jpg`;

    title.textContent =
        info.title || "YouTube Tournament";

    channel.textContent =
        `Channel: ${info.channelTitle || "YouTube"}`;

    date.textContent =
        `Broadcast: ${formatDisplayDateTime(
            getBestTournamentTime(info)
        )}`;

    game.textContent =
        `Game: ${detectGame(
            info.title,
            info.description
        )}`;

    statusText.textContent =
        statusLabel(info.status);

    dot.classList.toggle(
        "live",
        String(info.status).toUpperCase() === "LIVE"
    );

    preview.classList.add("show");
}

// ============================================================
// Fetch YouTube data
// ============================================================

async function fetchYouTubeInfo(videoId) {

    const endpoint =
        `${FOUR_FU_YOUTUBE_WORKER}/?youtubeLive=1&videoId=${encodeURIComponent(videoId)}`;

    const response =
        await fetch(endpoint, {
            method: "GET",
            cache: "no-store"
        });

    if (!response.ok) {

        throw new Error(
            `YouTube Worker returned HTTP ${response.status}`
        );

    }

    const data =
        await response.json();

    if (!data.success) {

        throw new Error(
            data.error ||
            "Unable to fetch YouTube data."
        );

    }

    return data;
}

// ============================================================
// Load existing tournament
// ============================================================

docRef.get()

.then(async (doc) => {

    if (!doc.exists) {

        alert("Tournament Not Found!");
        window.location.href =
            "tournaments.html";

        return;
    }

    currentTournament =
        doc.data();

    document.getElementById("prize").value =
        currentTournament.prize || "";

    document.getElementById("registration").value =
        currentTournament.registration || "";

    liveLinkInput.value =
        currentTournament.liveLink ||
        currentTournament.youtubeWatchUrl ||
        "";

    // Automatically fetch current YouTube data
    // when the edit page opens.
    if (liveLinkInput.value.trim()) {
        await loadPreview();
    }

})

.catch((err) => {

    console.error(err);

    alert("Failed to load Tournament.");

});

// ============================================================
// Preview current/new link
// ============================================================

async function loadPreview() {

    const value =
        liveLinkInput.value.trim();

    if (!value) {

        document
            .getElementById("autoPreview")
            .classList.remove("show");

        latestYouTubeInfo = null;

        return;
    }

    const videoId =
        extractYouTubeVideoId(value);

    if (!videoId) {

        latestYouTubeInfo = null;

        return;
    }

    try {

        const preview =
            document.getElementById("autoPreview");

        preview.classList.add("show");

        document.getElementById(
            "previewTitle"
        ).textContent =
            "Fetching YouTube data...";

        const info =
            await fetchYouTubeInfo(videoId);

        setPreview(info);

    } catch (error) {

        console.error(
            "4FU YouTube preview error:",
            error
        );

        latestYouTubeInfo = null;

        document.getElementById(
            "previewTitle"
        ).textContent =
            "Unable to fetch YouTube data";

        document.getElementById(
            "previewChannel"
        ).textContent =
            error.message ||
            "Check the YouTube link.";
    }
}

liveLinkInput.addEventListener(
    "input",
    () => {

        clearTimeout(previewTimer);

        previewTimer =
            setTimeout(
                loadPreview,
                650
            );

    }
);

liveLinkInput.addEventListener(
    "blur",
    loadPreview
);

// ============================================================
// Android FCM notification
// ============================================================

function send4FUTournamentUpdateNotification(
    tournament
) {

    try {

        fetch(
            FOUR_FU_ANDROID_FCM_URL,
            {

                method: "POST",

                mode: "no-cors",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({

                    type: "major",

                    updateType:
                        "tournament_update",

                    priority:
                        "normal",

                    title:
                        "🏆 Tournament Updated",

                    body:
                        `${tournament.title} has been updated.`,

                    link:
                        "/tournaments.html",

                    targetPlayerId:
                        "ALL",

                    senderEmail:
                        auth.currentUser?.email ||
                        "Admin"

                })

            }
        ).catch(error => {

            console.warn(
                "4FU ANDROID FCM TOURNAMENT UPDATE ERROR:",
                error
            );

        });

    } catch (error) {

        console.warn(
            "4FU ANDROID FCM TOURNAMENT UPDATE ERROR:",
            error
        );

    }
}

// ============================================================
// Update Tournament
// ============================================================

updateButton.addEventListener(
    "click",
    async () => {

        const youtubeUrl =
            liveLinkInput.value.trim();

        const videoId =
            extractYouTubeVideoId(
                youtubeUrl
            );

        if (!videoId) {

            alert(
                "❌ Please paste a valid YouTube Live / Watch link."
            );

            liveLinkInput.focus();

            return;
        }

        const originalButtonHTML =
            updateButton.innerHTML;

        updateButton.disabled = true;

        updateButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Fetching YouTube...';

        try {

            // Always fetch fresh data before updating.
            const info =
                await fetchYouTubeInfo(
                    videoId
                );

            const bestTime =
                getBestTournamentTime(info);

            const dateTime =
                formatIndiaDateTime(
                    bestTime
                );

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

            const updatedTournament = {

                // Automatic YouTube fields
                title:
                    info.title ||
                    "YouTube Tournament",

                game,

                mode,

                date:
                    dateTime.date,

                time:
                    dateTime.time,

                status:
                    statusLabel(info.status),

                liveStatus:
                    statusLabel(info.status),

                liveLink:
                    info.watchUrl ||
                    `https://www.youtube.com/watch?v=${videoId}`,

                youtubeVideoId:
                    info.videoId ||
                    videoId,

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
                    info.concurrentViewers ??
                    null,

                youtubeViewCount:
                    info.viewCount ??
                    null,

                youtubeLikeCount:
                    info.likeCount ??
                    null,

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

                // Keep manually entered optional data.
                prize:
                    document.getElementById(
                        "prize"
                    ).value.trim(),

                registration:
                    document.getElementById(
                        "registration"
                    ).value.trim(),

                updatedAt:
                    firebase.firestore.FieldValue
                        .serverTimestamp()

            };

            updateButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

            await docRef.update(
                updatedTournament
            );

            send4FUTournamentUpdateNotification({
                ...updatedTournament
            });

            alert(
                "✅ Tournament Updated Successfully!"
            );

            window.location.href =
                "tournaments.html";

        } catch (error) {

            console.error(
                "4FU AUTO EDIT TOURNAMENT ERROR:",
                error
            );

            updateButton.disabled = false;

            updateButton.innerHTML =
                originalButtonHTML;

            alert(
                "❌ Update Failed!\n\n" +
                (
                    error.message ||
                    "Unable to fetch/update YouTube data."
                )
            );

        }

    }
);
