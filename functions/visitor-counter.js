"use strict";

const COOLDOWN_MS = 30 * 60 * 1000;
const DAILY_LIMIT = 20;
const RATE_RECORD_TTL_MS = 48 * 60 * 60 * 1000;

function createVisitorCounterHandler({ db, Timestamp, FieldValue, hashIp, now = Date.now }) {
    if (!db || !Timestamp || !FieldValue || typeof hashIp !== "function") {
        throw new TypeError("Visitor counter dependencies are required.");
    }

    return async function countVisitor(req, res) {
        if (req.method !== "POST") {
            return res.status(405).json({ success: false, message: "Method not allowed." });
        }

        const ipAddress = req.ip;
        if (typeof ipAddress !== "string" || ipAddress.length === 0) {
            return res.status(400).json({ success: false, message: "Unable to process this visit." });
        }

        const currentTime = now();
        const dayKey = new Date(currentTime).toISOString().slice(0, 10);
        const ipDigest = hashIp(ipAddress);
        const rateRef = db.collection("_visitorRateLimits").doc(ipDigest);
        const statsRef = db.collection("stats").doc("visitors");

        try {
            const counted = await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(rateRef);
                const rate = snapshot.exists ? snapshot.data() : {};
                const lastCountedAt = rate.lastCountedAt?.toMillis?.() || 0;
                const dailyCount = rate.dayKey === dayKey ? Number(rate.dailyCount) || 0 : 0;

                if ((lastCountedAt > 0 && currentTime - lastCountedAt < COOLDOWN_MS) || dailyCount >= DAILY_LIMIT) {
                    return false;
                }

                transaction.set(rateRef, {
                    lastCountedAt: Timestamp.fromMillis(currentTime),
                    dayKey,
                    dailyCount: dailyCount + 1,
                    expiresAt: Timestamp.fromMillis(currentTime + RATE_RECORD_TTL_MS)
                }, { merge: true });
                transaction.set(statsRef, {
                    total: FieldValue.increment(1),
                    lastVisit: FieldValue.serverTimestamp()
                }, { merge: true });
                return true;
            });

            return res.status(200).json({ success: true, counted });
        } catch (error) {
            console.error("countVisitor error:", error);
            return res.status(500).json({ success: false, message: "Visitor count unavailable." });
        }
    };
}

module.exports = { createVisitorCounterHandler, COOLDOWN_MS, DAILY_LIMIT };
