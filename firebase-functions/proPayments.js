/**
 * 4FU PRO — Razorpay Monthly Subscription backend
 *
 * Deploy this function with your existing Firebase Functions project.
 *
 * Required runtime environment variables:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_PRO_PLAN_ID
 *   RAZORPAY_WEBHOOK_SECRET
 *
 * Never put KEY_SECRET or WEBHOOK_SECRET in frontend code.
 */

const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const REGION = "asia-south1";
const MONTHLY_PRICE_RUPEES = 49;
const PLAN_TOTAL_COUNT = 120; // Razorpay subscription maximum horizon is 10 years.
const RAZORPAY_API = "https://api.razorpay.com/v1";

function cors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Razorpay-Signature");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function json(res, status, body) {
  cors(res);
  res.status(status).json(body);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function razorpayAuthHeader() {
  const keyId = requireEnv("RAZORPAY_KEY_ID");
  const secret = requireEnv("RAZORPAY_KEY_SECRET");
  return "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
}

async function razorpayRequest(path, options = {}) {
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...options,
    headers: {
      "Authorization": razorpayAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = {raw: text};
  }

  if (!response.ok) {
    const message =
      data && data.error && data.error.description ||
      data && data.error && data.error.reason ||
      `Razorpay HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function verifyFirebaseUser(req) {
  const header = String(req.get("Authorization") || "");
  if (!header.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const idToken = header.slice(7).trim();
  if (!idToken) throw new Error("Authentication token missing.");

  return admin.auth().verifyIdToken(idToken);
}

async function findPlayerDoc(decoded) {
  if (decoded.uid) {
    const byUid = await db.collection("players").where("uid", "==", decoded.uid).limit(1).get();
    if (!byUid.empty) return byUid.docs[0];
  }

  if (decoded.email) {
    const byEmail = await db.collection("players").where("loginEmail", "==", decoded.email).limit(1).get();
    if (!byEmail.empty) return byEmail.docs[0];
  }

  return null;
}

async function setProEntitlement(uid, subscription, paymentId, paymentStatus) {
  const decoded = await admin.auth().getUser(uid);
  const playerDoc = await findPlayerDoc(decoded);
  if (!playerDoc) throw new Error("4FU player document not found.");

  const currentEndSeconds = Number(subscription && subscription.current_end || 0);
  const fallbackEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const expiresSeconds = currentEndSeconds > Math.floor(Date.now() / 1000) ?
    currentEndSeconds :
    fallbackEnd;

  const active =
    String(subscription && subscription.status || "").toLowerCase() === "active" &&
    expiresSeconds > Math.floor(Date.now() / 1000);

  const update = {
    proActive: active,
    proPlan: "monthly",
    proPrice: MONTHLY_PRICE_RUPEES,
    proStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    proExpiresAt: admin.firestore.Timestamp.fromMillis(expiresSeconds * 1000),
    proPaymentStatus: paymentStatus || (active ? "paid" : "inactive"),
    razorpaySubscriptionId: subscription && subscription.id || null,
    razorpayPaymentId: paymentId || null,
    proAutoRenew: active && String(subscription && subscription.status || "").toLowerCase() === "active",
    proUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await playerDoc.ref.set(update, {merge: true});

  await db.collection("proSubscriptions").doc(subscription.id).set({
    uid,
    playerDocId: playerDoc.id,
    planId: subscription.plan_id || requireEnv("RAZORPAY_PRO_PLAN_ID"),
    status: subscription.status || "created",
    currentStart: subscription.current_start || null,
    currentEnd: subscription.current_end || null,
    paymentId: paymentId || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  return {
    active,
    expiresAt: expiresSeconds * 1000,
    playerDocId: playerDoc.id,
    subscriptionId: subscription.id,
  };
}

function webhookSignatureValid(rawBody, signature) {
  const secret = requireEnv("RAZORPAY_WEBHOOK_SECRET");
  const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

  const actual = Buffer.from(String(signature || ""));
  const expectedBuffer = Buffer.from(expected);
  if (actual.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actual);
}

function routePath(req) {
  const p = String(req.path || "/").replace(/\/+$/, "");
  const parts = p.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

exports.proPayments = onRequest({region: REGION}, async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const route = routePath(req);

  try {
    // ---------------------------------------------------------
    // GET /proPayments/status
    // ---------------------------------------------------------
    if (req.method === "GET" && route === "status") {
      const decoded = await verifyFirebaseUser(req);
      const playerDoc = await findPlayerDoc(decoded);

      if (!playerDoc) {
        json(res, 404, {success: false, error: "Player not found."});
        return;
      }

      const p = playerDoc.data() || {};
      const expiry = p.proExpiresAt && p.proExpiresAt.toMillis ?
          p.proExpiresAt.toMillis() :
          Number(p.proExpiresAt || 0);

      const active =
          p.proActive === true &&
          expiry > Date.now();

      // Automatic expiry cleanup.
      if (!active && p.proActive === true) {
        await playerDoc.ref.set({
          proActive: false,
          proPaymentStatus: "expired",
          proAutoRenew: false,
          proUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});
      }

      json(res, 200, {
        success: true,
        active,
        expiresAt: active ? expiry : null,
        plan: active ? "monthly" : null,
        price: MONTHLY_PRICE_RUPEES,
      });
      return;
    }

    // ---------------------------------------------------------
    // POST /proPayments/create-subscription
    // ---------------------------------------------------------
    if (req.method === "POST" && route === "create-subscription") {
      const decoded = await verifyFirebaseUser(req);
      const playerDoc = await findPlayerDoc(decoded);

      if (!playerDoc) {
        json(res, 404, {success: false, error: "Player profile not found."});
        return;
      }

      const p = playerDoc.data() || {};
      const expiry = p.proExpiresAt && p.proExpiresAt.toMillis ?
          p.proExpiresAt.toMillis() :
          Number(p.proExpiresAt || 0);

      if (p.proActive === true && expiry > Date.now()) {
        json(res, 409, {
          success: false,
          error: "PRO is already active.",
          expiresAt: expiry,
        });
        return;
      }

      const planId = requireEnv("RAZORPAY_PRO_PLAN_ID");

      const subscription = await razorpayRequest("/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          total_count: PLAN_TOTAL_COUNT,
          quantity: 1,
          customer_notify: 1,
          notes: {
            uid: decoded.uid,
            playerDocId: playerDoc.id,
            product: "4FU PRO",
            plan: "monthly",
          },
        }),
      });

      await db.collection("proSubscriptions").doc(subscription.id).set({
        uid: decoded.uid,
        playerDocId: playerDoc.id,
        planId,
        status: subscription.status || "created",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      json(res, 200, {
        success: true,
        keyId: requireEnv("RAZORPAY_KEY_ID"),
        subscriptionId: subscription.id,
        planId,
        amount: MONTHLY_PRICE_RUPEES,
        currency: "INR",
      });
      return;
    }

    // ---------------------------------------------------------
    // POST /proPayments/verify
    // ---------------------------------------------------------
    if (req.method === "POST" && route === "verify") {
      const decoded = await verifyFirebaseUser(req);
      const body = req.body || {};

      const paymentId = String(body.razorpay_payment_id || "");
      const returnedSubscriptionId = String(body.razorpay_subscription_id || "");
      const signature = String(body.razorpay_signature || "");

      if (!paymentId || !returnedSubscriptionId || !signature) {
        json(res, 400, {success: false, error: "Incomplete Razorpay verification data."});
        return;
      }

      // Never trust the subscription id sent by the browser.
      const subDoc = await db.collection("proSubscriptions").doc(returnedSubscriptionId).get();
      if (!subDoc.exists || subDoc.data().uid !== decoded.uid) {
        json(res, 403, {success: false, error: "Subscription does not belong to this account."});
        return;
      }

      const subscriptionId = subDoc.id;
      const generated = crypto
          .createHmac("sha256", requireEnv("RAZORPAY_KEY_SECRET"))
          .update(`${paymentId}|${subscriptionId}`)
          .digest("hex");

      if (
        generated.length !== signature.length ||
          !crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature))
      ) {
        json(res, 400, {success: false, error: "Razorpay signature verification failed."});
        return;
      }

      const subscription = await razorpayRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        method: "GET",
      });

      const result = await setProEntitlement(
          decoded.uid,
          subscription,
          paymentId,
          "paid",
      );

      json(res, 200, {
        success: true,
        active: result.active,
        expiresAt: result.expiresAt,
        subscriptionId,
      });
      return;
    }

    // ---------------------------------------------------------
    // POST /proPayments/webhook
    // ---------------------------------------------------------
    if (req.method === "POST" && route === "webhook") {
      const rawBody = req.rawBody ?
          req.rawBody.toString("utf8") :
          JSON.stringify(req.body || {});
      const signature = req.get("X-Razorpay-Signature");

      if (!signature || !webhookSignatureValid(rawBody, signature)) {
        json(res, 400, {success: false, error: "Invalid webhook signature."});
        return;
      }

      const event = req.body || {};
      const sub = event && event.payload && event.payload.subscription ?
          (event.payload.subscription.entity || event.payload.subscription) :
          null;
      const payment = event && event.payload && event.payload.payment ?
          (event.payload.payment.entity || event.payload.payment) :
          null;

      const eventName = String(event.event || "");

      if (sub && sub.id) {
        const stored = await db.collection("proSubscriptions").doc(sub.id).get();
        const storedData = stored.exists ? stored.data() : {};
        const uid = storedData.uid || sub.notes && sub.notes.uid;

        if (uid) {
          const activeEvents = new Set([
            "subscription.activated",
            "subscription.charged",
            "subscription.resumed",
          ]);

          const hardOffEvents = new Set([
            "subscription.halted",
            "subscription.completed",
            "subscription.cancelled",
          ]);

          if (activeEvents.has(eventName)) {
            await setProEntitlement(uid, sub, (payment && payment.id) || null, "paid");
          } else if (hardOffEvents.has(eventName)) {
            const playerDoc = await findPlayerDoc(await admin.auth().getUser(uid));
            if (playerDoc) {
              const end = Number(sub.current_end || sub.end_at || 0);
              const endMs = end > 0 ? end * 1000 : Date.now();
              const stillValid = endMs > Date.now();

              await playerDoc.ref.set({
                proActive: stillValid,
                proPaymentStatus: stillValid ? "cancelled_pending_expiry" : "inactive",
                proExpiresAt: admin.firestore.Timestamp.fromMillis(endMs),
                proAutoRenew: false,
                razorpaySubscriptionId: sub.id,
                proUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, {merge: true});
            }
          } else if (eventName === "subscription.pending" || eventName === "payment.failed") {
            const playerDoc = await findPlayerDoc(await admin.auth().getUser(uid));
            if (playerDoc) {
              await playerDoc.ref.set({
                proPaymentStatus: "payment_pending_or_failed",
                proUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              }, {merge: true});
            }
          }
        }

        await db.collection("proSubscriptions").doc(sub.id).set({
          status: sub.status || eventName,
          currentStart: sub.current_start || null,
          currentEnd: sub.current_end || null,
          lastEvent: eventName,
          paymentId: (payment && payment.id) || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});
      }

      res.status(200).json({success: true});
      return;
    }

    json(res, 404, {success: false, error: "Unknown proPayments route."});
  } catch (error) {
    console.error("[4FU PRO PAYMENTS]", error);
    json(res, 500, {success: false, error: error.message || "Internal error."});
  }
});


// ---------------------------------------------------------
// Hourly entitlement cleanup.
// This is a safety net so an expired PRO entitlement is turned
// off even if the player does not open the PRO page.
// ---------------------------------------------------------
exports.expireProEntitlements = onSchedule({region: REGION, schedule: "every 1 hours"}, async () => {
  const now = admin.firestore.Timestamp.now();
  const snap = await db
      .collection("players")
      .where("proExpiresAt", "<=", now)
      .limit(500)
      .get();

  if (snap.empty) return null;

  const batch = db.batch();
  let count = 0;

  snap.docs.forEach((doc) => {
    const p = doc.data() || {};
    if (p.proActive === true) {
      batch.set(doc.ref, {
        proActive: false,
        proPaymentStatus: "expired",
        proAutoRenew: false,
        proUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      count += 1;
    }
  });

  if (count) await batch.commit();
  console.info(`[4FU PRO] Expired ${count} entitlement(s).`);
  return null;
});
