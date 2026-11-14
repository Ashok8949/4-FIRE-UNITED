const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("node:crypto");

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();


// ============================================================
// EXISTING: CREATE PLAYER ACCOUNT
// ============================================================

exports.createPlayerAccount = onRequest(async (req, res) => {

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    try {

        // Only POST requests
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });
        }

        // Get Firebase ID token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Verify currently logged-in admin
        const idToken = authHeader.split("Bearer ")[1];

        const decodedToken = await auth.verifyIdToken(idToken);

        if (!decodedToken.uid) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const {
            email,
            password,
            playerId
        } = req.body;

        // Validate data
        if (!email || !password || !playerId) {
            return res.status(400).json({
                success: false,
                message: "Email, password and playerId are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Check player exists
        const playerRef = db.collection("players").doc(playerId);
        const playerSnap = await playerRef.get();

        if (!playerSnap.exists) {
            return res.status(404).json({
                success: false,
                message: "Player profile not found"
            });
        }

        // Check whether this player already has an account
        const playerData = playerSnap.data();

        if (playerData.authUid) {
            return res.status(400).json({
                success: false,
                message: "This player already has a login account"
            });
        }

        // Check whether email is already registered
        let userRecord;

        try {

            userRecord = await auth.getUserByEmail(email);

        } catch (error) {

            if (error.code === "auth/user-not-found") {
                userRecord = null;
            } else {
                throw error;
            }

        }

        // Create Firebase Auth account if it doesn't exist
        if (!userRecord) {

            userRecord = await auth.createUser({
                email: email,
                password: password,
                emailVerified: false
            });

        }

        // Link Auth UID with player profile
        await playerRef.update({
            loginEmail: email,
            authUid: userRecord.uid
        });

        return res.status(200).json({
            success: true,
            message: "Player account created successfully",
            uid: userRecord.uid
        });

    } catch (error) {

        console.error("createPlayerAccount error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong"
        });

    }

});


// ============================================================
// NEW: FREE FIRE PLAYER BACKEND
// ============================================================

exports.getFreeFirePlayer = onRequest(
    {
        region: "asia-south1",
        timeoutSeconds: 30,
        memory: "256MiB"
    },
    async (req, res) => {

        // ----------------------------------------------------
        // CORS
        // ----------------------------------------------------

        res.set("Access-Control-Allow-Origin", "*");
        res.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );
        res.set(
            "Access-Control-Allow-Methods",
            "GET, OPTIONS"
        );

        if (req.method === "OPTIONS") {
            return res.status(204).send("");
        }

        // ----------------------------------------------------
        // Only GET
        // ----------------------------------------------------

        if (req.method !== "GET") {
            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });
        }

        try {

            // ------------------------------------------------
            // GET UID + REGION
            // ------------------------------------------------

            const uid = String(req.query.uid || "").trim();

            const region = String(
                req.query.region || "IND"
            ).trim().toUpperCase();

            // ------------------------------------------------
            // Validate UID
            // ------------------------------------------------

            if (!uid) {
                return res.status(400).json({
                    success: false,
                    message: "Free Fire UID is required"
                });
            }

            if (!/^\d{5,15}$/.test(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Free Fire UID"
                });
            }

            // ------------------------------------------------
            // Allowed regions
            // ------------------------------------------------

            const allowedRegions = [
                "IND",
                "SG",
                "BR"
            ];

            if (!allowedRegions.includes(region)) {
                return res.status(400).json({
                    success: false,
                    message: "Unsupported region"
                });
            }

            // ------------------------------------------------
            // FREE FIRE API
            // ------------------------------------------------

            const API_BASE =
                "https://free-ff-api-src-5plp.onrender.com/api/v1";

            const accountURL =
                `${API_BASE}/account?region=${encodeURIComponent(region)}&uid=${encodeURIComponent(uid)}`;

            const statsURL =
                `${API_BASE}/playerstats?region=${encodeURIComponent(region)}&uid=${encodeURIComponent(uid)}`;

            console.log(
                `[4FU Backend] Fetching Free Fire player ${uid} (${region})`
            );

            // ------------------------------------------------
            // Helper: fetch with timeout
            // ------------------------------------------------

            async function fetchJSON(url) {

                const controller = new AbortController();

                const timeout = setTimeout(() => {
                    controller.abort();
                }, 15000);

                try {

                    const response = await fetch(url, {
                        method: "GET",
                        headers: {
                            "Accept": "application/json"
                        },
                        signal: controller.signal
                    });

                    const text = await response.text();

                    let data = null;

                    try {
                        data = JSON.parse(text);
                    } catch (parseError) {
                        throw new Error(
                            `Invalid JSON response (${response.status})`
                        );
                    }

                    if (!response.ok) {
                        throw new Error(
                            `Free Fire API returned HTTP ${response.status}`
                        );
                    }

                    return data;

                } finally {

                    clearTimeout(timeout);

                }

            }

            // ------------------------------------------------
            // Fetch account
            // ------------------------------------------------

            let accountData = null;

            try {

                accountData = await fetchJSON(accountURL);

                console.log(
                    "[4FU Backend] Account data received"
                );

            } catch (error) {

                console.error(
                    "[4FU Backend] Account request failed:",
                    error.message
                );

                return res.status(502).json({
                    success: false,
                    source: "freefire-api",
                    message: "Free Fire account API unavailable",
                    error: error.message
                });

            }

            // ------------------------------------------------
            // Fetch stats
            // ------------------------------------------------

            let statsData = null;

            try {

                statsData = await fetchJSON(statsURL);

                console.log(
                    "[4FU Backend] Stats data received"
                );

            } catch (error) {

                console.warn(
                    "[4FU Backend] Stats request failed:",
                    error.message
                );

                // Account can still be returned
                statsData = null;
            }

            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

            return res.status(200).json({
                success: true,

                uid: uid,

                region: region,

                basicInfo:
                    accountData?.basicInfo ||
                    accountData?.data?.basicInfo ||
                    null,

                clanBasicInfo:
                    accountData?.clanBasicInfo ||
                    accountData?.data?.clanBasicInfo ||
                    null,

                socialInfo:
                    accountData?.socialInfo ||
                    accountData?.data?.socialInfo ||
                    null,

                stats:
                    statsData?.stats ||
                    statsData?.data?.stats ||
                    statsData?.playerStats ||
                    statsData?.data?.playerStats ||
                    statsData?.data ||
                    statsData ||
                    null,

                rawAccount: accountData,

                rawStats: statsData
            });

        } catch (error) {

            console.error(
                "[4FU Backend] getFreeFirePlayer error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to fetch Free Fire player data"
            });

        }

    }
);

// ============================================================
// PUBLIC: LOOK UP AN APPLICATION STATUS USING UID + EMAIL
// Returns only status-facing fields; never exposes the full
// application record or enables direct public Firestore reads.
// ============================================================

exports.lookupJoinApplicationStatus = onRequest(
    {
        region: "asia-south1",
        cors: true,
        timeoutSeconds: 15,
        memory: "256MiB"
    },
    async (req, res) => {
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });
        }

        try {
            const uid = String(req.body?.uid || "").trim();
            const email = String(req.body?.email || "").trim().toLowerCase();

            if (!/^\d{5,15}$/.test(uid) ||
                email.length > 254 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "A valid UID and application email are required."
                });
            }

            // Query by UID, then compare email server-side to avoid requiring
            // a composite Firestore index or returning unrelated applications.
            const matches = await db.collection("joinApplications")
                .where("uid", "==", uid)
                .limit(20)
                .get();

            const match = matches.docs.find((item) =>
                String(item.data().email || "").trim().toLowerCase() === email
            );

            if (!match) {
                return res.status(404).json({
                    success: true,
                    found: false
                });
            }

            const application = match.data();
            const status = ["Pending", "Accepted", "Rejected"].includes(application.status)
                ? application.status
                : "Pending";

            return res.status(200).json({
                success: true,
                found: true,
                application: {
                    name: String(application.name || ""),
                    ign: String(application.ign || ""),
                    uid,
                    rank: String(application.rank || ""),
                    appliedOn: String(application.appliedOn || ""),
                    status,
                    message: String(application.message || "").slice(0, 1000)
                }
            });
        } catch (error) {
            console.error("lookupJoinApplicationStatus error:", error);
            return res.status(500).json({
                success: false,
                message: "Unable to check application status right now."
            });
        }
    }
);




// Public visitor counter endpoint. Rate-limit behavior lives in a dependency-injected
// module so its cooldown and daily-cap behavior can be tested without Firebase.
const { createVisitorCounterHandler } = require("./visitor-counter");

exports.countVisitor = onRequest(
    { region: "asia-south1", cors: true, maxInstances: 10 },
    createVisitorCounterHandler({
        db,
        Timestamp: admin.firestore.Timestamp,
        FieldValue: admin.firestore.FieldValue,
        hashIp: (ip) => crypto.createHash("sha256").update(ip).digest("hex")
    })
);

// Server-side admin alerts for public form submissions.
async function createAdminAlert(event, notification) {
    if (!event.data) return;
    const eventId = event.id || event.data.id;
    await db.collection("notifications").doc(eventId).set({
        ...notification,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
}

exports.notifyOnContactMessage = onDocumentCreated(
    { document: "contactMessages/{messageId}", region: "asia-south1" },
    async (event) => {
        const data = event.data?.data() || {};
        await createAdminAlert(event, {
            title: "New Contact Message",
            message: `${String(data.name || "A visitor").slice(0, 100)} sent a new contact message`,
            type: "contact",
            link: "messages.html"
        });
    }
);

exports.notifyOnJoinApplication = onDocumentCreated(
    { document: "joinApplications/{applicationId}", region: "asia-south1" },
    async (event) => {
        const data = event.data?.data() || {};
        await createAdminAlert(event, {
            title: "New Team Application",
            message: `${String(data.ign || data.name || "A player").slice(0, 100)} applied to join the team`,
            type: "application",
            link: "applications.html"
        });
    }
);

exports.notifyOnChallengeRegistration = onDocumentCreated(
    { document: "challengeRegistrations/{registrationId}", region: "asia-south1" },
    async (event) => {
        const data = event.data?.data() || {};
        await createAdminAlert(event, {
            title: "🔥 New Challenge Registration",
            message: `${String(data.leaderName || data.teamName || "A player").slice(0, 100)} registered for ${String(data.selectedChallenge || data.challengeName || "a")} Challenge`,
            type: "challenge",
            link: "challenge-registrations.html"
        });
    }
);
