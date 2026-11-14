"use strict";

const RATE_RECORD_TTL_MS = 48 * 60 * 60 * 1000;

function createPublicRateLimiter({ db, Timestamp, hashIp, now = Date.now }) {
    if (!db || !Timestamp || typeof hashIp !== "function") {
        throw new TypeError("Public rate limiter dependencies are required.");
    }

    return {
        async allow(req, scope, limit, windowMs) {
            if (typeof req?.ip !== "string" || !req.ip ||
                typeof scope !== "string" || !scope ||
                !Number.isInteger(limit) || limit < 1 ||
                !Number.isFinite(windowMs) || windowMs < 1) {
                return false;
            }

            const currentTime = now();
            const documentId = hashIp(`${scope}:${req.ip}`);
            if (typeof documentId !== "string" || !/^[a-f0-9]{64}$/i.test(documentId)) {
                throw new Error("Rate-limit key generation failed.");
            }

            const ref = db.collection("publicApiRateLimits").doc(documentId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                const stored = snapshot.exists ? snapshot.data() : {};
                const startedAt = Number(stored.windowStartedAtMs);
                const previousCount = Number(stored.count);
                const windowActive = Number.isFinite(startedAt) &&
                    currentTime >= startedAt &&
                    currentTime - startedAt < windowMs;
                const count = windowActive && Number.isFinite(previousCount)
                    ? Math.max(0, Math.floor(previousCount))
                    : 0;

                if (count >= limit) return false;

                const windowStartedAtMs = windowActive ? startedAt : currentTime;
                transaction.set(ref, {
                    scope,
                    count: count + 1,
                    windowStartedAtMs,
                    expiresAt: Timestamp.fromMillis(currentTime + RATE_RECORD_TTL_MS)
                });
                return true;
            });
        }
    };
}

module.exports = { createPublicRateLimiter };
