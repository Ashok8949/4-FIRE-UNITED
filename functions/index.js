const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

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

        const idToken = authHeader.split("Bearer ")[1];

        // Verify currently logged-in admin
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