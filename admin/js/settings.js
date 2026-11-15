const settingsRef = db.collection("settings").doc("website");

const FESTIVAL_IDS = new Set([
    "diwali", "holi", "eid", "christmas", "newyear", "independence", "halloween"
]);

function parseIndiaDateTime(value) {
    const helper = window.FourFUIndiaDateTime;
    return helper && typeof helper.parse === "function" ? helper.parse(value) : null;
}

function validateFestivalSchedule() {
    const mode = document.getElementById("festivalMode").value;
    const startInput = document.getElementById("festivalStart");
    const endInput = document.getElementById("festivalEnd");
    const error = document.getElementById("festivalScheduleError");
    startInput.removeAttribute("aria-invalid");
    endInput.removeAttribute("aria-invalid");
    error.textContent = "";

    if (!["manual", "scheduled"].includes(mode)) {
        error.textContent = "Select a valid activation mode.";
        return { valid: false };
    }
    if (mode === "manual") return { valid: true, startAt: "", endAt: "" };

    const start = parseIndiaDateTime(startInput.value);
    const end = parseIndiaDateTime(endInput.value);
    if (!startInput.value || !endInput.value || !start || !end) {
        if (!start) startInput.setAttribute("aria-invalid", "true");
        if (!end) endInput.setAttribute("aria-invalid", "true");
        error.textContent = "Scheduled mode requires valid start and end date/time values (India time).";
        return { valid: false };
    }
    if (end.getTime() <= start.getTime()) {
        startInput.setAttribute("aria-invalid", "true");
        endInput.setAttribute("aria-invalid", "true");
        error.textContent = "End date and time must be later than the start date and time.";
        return { valid: false };
    }
    return { valid: true, startAt: start.toISOString(), endAt: end.toISOString() };
}

function refreshFestivalScheduleFeedback() {
    const enabled = document.getElementById("festivalEnabled").value === "true";
    const mode = document.getElementById("festivalMode").value;
    const startInput = document.getElementById("festivalStart");
    const endInput = document.getElementById("festivalEnd");
    const error = document.getElementById("festivalScheduleError");
    if (!enabled || mode === "manual") {
        startInput.removeAttribute("aria-invalid");
        endInput.removeAttribute("aria-invalid");
        error.textContent = "";
        return;
    }
    validateFestivalSchedule();
}
document.getElementById("festivalEnabled").addEventListener("change", refreshFestivalScheduleFeedback);
document.getElementById("festivalMode").addEventListener("change", refreshFestivalScheduleFeedback);
document.getElementById("festivalStart").addEventListener("input", refreshFestivalScheduleFeedback);
document.getElementById("festivalEnd").addEventListener("input", refreshFestivalScheduleFeedback);

// =====================================
// LOAD SETTINGS
// =====================================

settingsRef.get()

.then((doc) => {

    if (!doc.exists) return;

    const s = doc.data();

    document.getElementById("teamName").value = s.teamName || "";
    document.getElementById("email").value = s.email || "";
    document.getElementById("phone").value = s.phone || "";
    document.getElementById("address").value = s.address || "";
    document.getElementById("logo").value = s.logo || "";
    document.getElementById("heroTitle").value = s.heroTitle || "";
    document.getElementById("heroSubtitle").value = s.heroSubtitle || "";
    document.getElementById("instagram").value = s.instagram || "";
    document.getElementById("youtube").value = s.youtube || "";
    document.getElementById("discord").value = s.discord || "";
    document.getElementById("facebook").value = s.facebook || "";

    const festival = s.festival || {};
    document.getElementById("festivalEnabled").value = String(festival.enabled === true);
    document.getElementById("festivalMode").value = festival.mode || "manual";
    document.getElementById("festivalName").value = festival.festival || "diwali";
    const toIndiaInput = value => window.FourFUIndiaDateTime.format(value);
    document.getElementById("festivalStart").value = toIndiaInput(festival.startAt);
    document.getElementById("festivalEnd").value = toIndiaInput(festival.endAt);
    refreshFestivalScheduleFeedback();

})

.catch((err) => {

    console.error("Failed to load settings:", err);

});


// =====================================
// SAVE SETTINGS
// =====================================

document.getElementById("saveSettings").addEventListener("click", () => {

    const btn = document.getElementById("saveSettings");
    const festivalEnabled = document.getElementById("festivalEnabled").value === "true";
    const festivalMode = document.getElementById("festivalMode").value;
    const festivalId = document.getElementById("festivalName").value;

    // Disabling the experience must always be possible, even if an old or
    // partially edited schedule is invalid. Clear inactive dates on save.
    const schedule = festivalEnabled
        ? validateFestivalSchedule()
        : { valid: true, startAt: "", endAt: "" };
    const safeFestivalId = FESTIVAL_IDS.has(festivalId) ? festivalId : (festivalEnabled ? null : "diwali");

    // The off switch is a recovery path: it must work even if legacy stored
    // festival metadata is malformed. Normalize invalid metadata while off.
    if (!schedule.valid || !safeFestivalId) {
        if (schedule.valid) document.getElementById("festivalScheduleError").textContent = "Select a supported festival theme.";
        return;
    }
    if (!festivalEnabled) {
        document.getElementById("festivalStart").removeAttribute("aria-invalid");
        document.getElementById("festivalEnd").removeAttribute("aria-invalid");
        document.getElementById("festivalScheduleError").textContent = "";
    }

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';


    const settingsData = {

        teamName:
            document.getElementById("teamName").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        phone:
            document.getElementById("phone").value.trim(),

        address:
            document.getElementById("address").value.trim(),

        logo:
            document.getElementById("logo").value.trim(),

        heroTitle:
            document.getElementById("heroTitle").value.trim(),

        heroSubtitle:
            document.getElementById("heroSubtitle").value.trim(),

        instagram:
            document.getElementById("instagram").value.trim(),

        youtube:
            document.getElementById("youtube").value.trim(),

        discord:
            document.getElementById("discord").value.trim(),

        facebook:
            document.getElementById("facebook").value.trim(),

        festival: {
            enabled: festivalEnabled,
            mode: ["manual", "scheduled"].includes(festivalMode) ? festivalMode : "manual",
            festival: safeFestivalId,
            startAt: schedule.startAt,
            endAt: schedule.endAt
        }

    };


    // Read and merge inside a transaction so unrelated settings (including
    // unknown fields inside festival) survive this form save. The transaction
    // also retries if another writer changes the document concurrently.
    db.runTransaction((transaction) => {
        return transaction.get(settingsRef).then((doc) => {
            const existingSettings = doc.exists ? doc.data() : {};
            const existingFestival = existingSettings.festival &&
                typeof existingSettings.festival === "object" &&
                !Array.isArray(existingSettings.festival)
                ? existingSettings.festival
                : {};

            const mergedSettings = {
                ...existingSettings,
                ...settingsData,
                festival: {
                    ...existingFestival,
                    ...settingsData.festival
                }
            };

            transaction.set(settingsRef, mergedSettings);
        });
    })

    .then(() => {

        alert("✅ Settings Saved Successfully!");

    })

    .catch((err) => {

        console.error("Failed to save settings:", err);

        alert("❌ Failed to Save Settings!");

    })

    .finally(() => {

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Settings';

    });

});

// =====================================
// FESTIVAL PREVIEW (public, read-only; never publishes)
// =====================================
document.getElementById("previewFestival").addEventListener("click", () => {
    const festival = document.getElementById("festivalName").value;
    const status = document.getElementById("festivalPreviewStatus");
    const fallback = document.getElementById("festivalPreviewFallback");
    fallback.hidden = true;
    fallback.removeAttribute("href");
    status.textContent = "";
    if (!FESTIVAL_IDS.has(festival)) {
        status.textContent = "Select a supported festival theme before previewing.";
        return;
    }
    let previewUrl;
    try {
        previewUrl = new URL("../index.html", window.location.href);
        previewUrl.searchParams.set("festivalPreview", festival);
        if (previewUrl.origin !== window.location.origin) throw new Error("Preview must stay on this website.");
    } catch (_) {
        status.textContent = "Could not build a safe preview link. Reload Settings and try again.";
        return;
    }
    let previewWindow = null;
    try { previewWindow = window.open("about:blank", "_blank"); } catch (_) {}
    if (previewWindow) {
        try {
            previewWindow.opener = null;
            previewWindow.location.replace(previewUrl.href);
            status.textContent = "Preview opened. This is a public, read-only demo; anyone with its URL can view it. It does not publish settings.";
            return;
        } catch (_) {
            try { previewWindow.close(); } catch (_) {}
        }
    }
    fallback.href = previewUrl.href;
    fallback.hidden = false;
    status.textContent = "Your browser blocked the preview popup. Use the link below to open the public read-only demo.";
});
