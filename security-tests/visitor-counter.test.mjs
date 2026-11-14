import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const { createVisitorCounterHandler, COOLDOWN_MS, DAILY_LIMIT } = require("../functions/visitor-counter.js");

const increment = Symbol("increment");
const serverTimestamp = Symbol("serverTimestamp");
const Timestamp = { fromMillis: (value) => ({ toMillis: () => value, value }) };

function makeHarness({ time = Date.UTC(2026, 10, 14, 10), ip = "203.0.113.10", fail = false, hashIp = (value) => createHash("sha256").update(value).digest("hex") } = {}) {
  const records = new Map();
  const db = {
    collection(name) {
      return { doc(id) { return { key: name + "/" + id }; } };
    },
    async runTransaction(callback) {
      if (fail) throw new Error("simulated database outage");
      const writes = [];
      const tx = {
        async get(ref) {
          const value = records.get(ref.key);
          return { exists: Boolean(value), data: () => value };
        },
        set(ref, data, options) { writes.push({ ref, data, options }); }
      };
      const result = await callback(tx);
      for (const write of writes) {
        const previous = records.get(write.ref.key) || {};
        const next = { ...previous, ...write.data };
        if (next.total === increment) next.total = (previous.total || 0) + 1;
        if (next.lastVisit === serverTimestamp) next.lastVisit = time;
        records.set(write.ref.key, next);
      }
      return result;
    }
  };
  const handler = createVisitorCounterHandler({
    db, Timestamp, FieldValue: { increment: () => increment, serverTimestamp: () => serverTimestamp },
    hashIp, now: () => time
  });
  async function call(method = "POST", requestIp = ip) {
    const response = { statusCode: 200, body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; }
    };
    await handler({ method, ip: requestIp }, response);
    return response;
  }
  return { call, records, setTime(value) { time = value; } };
}

test("counts first visit and stores only hashed IP with expiry", async () => {
  const h = makeHarness();
  const response = await h.call();
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { success: true, counted: true });
  assert.equal(h.records.get("stats/visitors").total, 1);
  const rate = h.records.get("_visitorRateLimits/" + createHash("sha256").update("203.0.113.10").digest("hex"));
  assert.equal(rate.dailyCount, 1);
  assert.equal(rate.expiresAt.toMillis() - rate.lastCountedAt.toMillis(), 48 * 60 * 60 * 1000);
  assert.equal([...h.records.keys()].some((key) => key.includes("203.0.113.10")), false);
});

test("enforces 30-minute cooldown without incrementing total", async () => {
  const h = makeHarness();
  await h.call();
  h.setTime(Date.UTC(2026, 10, 14, 10) + COOLDOWN_MS - 1);
  assert.deepEqual((await h.call()).body, { success: true, counted: false });
  assert.equal(h.records.get("stats/visitors").total, 1);
});

test("allows a visit at the exact cooldown boundary", async () => {
  const h = makeHarness();
  await h.call();
  h.setTime(Date.UTC(2026, 10, 14, 10) + COOLDOWN_MS);
  assert.equal((await h.call()).body.counted, true);
  assert.equal(h.records.get("stats/visitors").total, 2);
});

test("enforces the daily cap after twenty counts even when cooldown has elapsed", async () => {
  const h = makeHarness();
  for (let i = 0; i < DAILY_LIMIT; i++) {
    h.setTime(Date.UTC(2026, 10, 14, 0) + i * COOLDOWN_MS);
    assert.equal((await h.call()).body.counted, true);
  }
  h.setTime(Date.UTC(2026, 10, 14, 23, 59));
  assert.equal((await h.call()).body.counted, false);
  assert.equal(h.records.get("stats/visitors").total, DAILY_LIMIT);
});

test("resets the daily counter on UTC date rollover", async () => {
  const h = makeHarness();
  await h.call();
  h.setTime(Date.UTC(2026, 10, 15, 0, 1));
  assert.equal((await h.call()).body.counted, true);
  assert.equal(h.records.get("stats/visitors").total, 2);
  assert.equal(h.records.get("_visitorRateLimits/" + createHash("sha256").update("203.0.113.10").digest("hex")).dailyCount, 1);
});

test("rejects non-POST requests and missing IP addresses", async () => {
  const h = makeHarness();
  assert.equal((await h.call("GET")).statusCode, 405);
  assert.equal((await h.call("POST", "")).statusCode, 400);
  assert.equal(h.records.size, 0);
});

test("returns a generic 500 response when Firestore fails", async () => {
  const h = makeHarness({ fail: true });
  const response = await h.call();
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Visitor count unavailable.");
});

test("fails closed with a generic response when IP hashing is unavailable", async () => {
  const h = makeHarness({ hashIp: () => { throw new Error("secret not configured"); } });
  const response = await h.call();
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { success: false, message: "Visitor count unavailable." });
  assert.equal(h.records.size, 0);
});

test("normalizes malformed stored daily counters instead of trusting them", async () => {
  const h = makeHarness();
  const digest = createHash("sha256").update("203.0.113.10").digest("hex");
  h.records.set("_visitorRateLimits/" + digest, {
    dayKey: "2026-11-14",
    dailyCount: "not-a-number",
    lastCountedAt: Timestamp.fromMillis(Date.UTC(2026, 10, 14, 9))
  });
  const response = await h.call();
  assert.deepEqual(response.body, { success: true, counted: true });
  assert.equal(h.records.get("_visitorRateLimits/" + digest).dailyCount, 1);
});
