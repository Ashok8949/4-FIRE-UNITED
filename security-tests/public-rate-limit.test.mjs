import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicRateLimiter } from "../functions/public-rate-limit.js";

function fixture({ now = 1_800_000_000_000, records = new Map() } = {}) {
  const db = {
    collection(name) {
      assert.equal(name, "publicApiRateLimits");
      return { doc(id) { return { id }; } };
    },
    async runTransaction(callback) {
      const writes = [];
      const tx = {
        async get(ref) {
          return { exists: records.has(ref.id), data: () => records.get(ref.id) };
        },
        set(ref, value) { writes.push([ref.id, value]); }
      };
      const result = await callback(tx);
      for (const [id, value] of writes) records.set(id, value);
      return result;
    }
  };
  const Timestamp = { fromMillis: (value) => ({ toMillis: () => value }) };
  const limiter = createPublicRateLimiter({
    db, Timestamp,
    hashIp: (value) => requireHash(value),
    now: () => now
  });
  return { limiter, records, setNow(value) { now = value; } };
}
import { createHash } from "node:crypto";
function requireHash(value) { return createHash("sha256").update(value).digest("hex"); }

test("allows requests up to the configured limit and rejects the next request", async () => {
  const { limiter, records } = fixture();
  for (let i = 0; i < 5; i++) {
    assert.equal(await limiter.allow({ ip: "203.0.113.1" }, "status", 5, 60_000), true);
  }
  assert.equal(await limiter.allow({ ip: "203.0.113.1" }, "status", 5, 60_000), false);
  assert.equal(records.size, 1);
});

test("isolates rate limits by IP and endpoint scope", async () => {
  const { limiter } = fixture();
  assert.equal(await limiter.allow({ ip: "203.0.113.1" }, "status", 1, 60_000), true);
  assert.equal(await limiter.allow({ ip: "203.0.113.2" }, "status", 1, 60_000), true);
  assert.equal(await limiter.allow({ ip: "203.0.113.1" }, "freefire", 1, 60_000), true);
});

test("resets an expired window", async () => {
  const state = fixture();
  assert.equal(await state.limiter.allow({ ip: "203.0.113.1" }, "status", 1, 60_000), true);
  assert.equal(await state.limiter.allow({ ip: "203.0.113.1" }, "status", 1, 60_000), false);
  state.setNow(1_800_000_061_000);
  assert.equal(await state.limiter.allow({ ip: "203.0.113.1" }, "status", 1, 60_000), true);
});

test("fails closed for missing IP or malformed rate-limit inputs", async () => {
  const { limiter } = fixture();
  assert.equal(await limiter.allow({}, "status", 5, 60_000), false);
  assert.equal(await limiter.allow({ ip: "203.0.113.1" }, "status", 0, 60_000), false);
});
