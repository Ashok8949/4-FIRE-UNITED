import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isAuthorizedAdminToken } = require("../functions/security-guards.js");

test("accepts only the verified configured administrator identity", () => {
  assert.equal(isAuthorizedAdminToken({
    uid: "admin-uid",
    email: "aks303603@gmail.com",
    email_verified: true
  }), true);
});

test("rejects a different authenticated email", () => {
  assert.equal(isAuthorizedAdminToken({
    uid: "user-uid",
    email: "player@example.com",
    email_verified: true
  }), false);
});

test("rejects an unverified administrator email", () => {
  assert.equal(isAuthorizedAdminToken({
    uid: "unverified-uid",
    email: "aks303603@gmail.com",
    email_verified: false
  }), false);
});

test("rejects missing or malformed token claims", () => {
  assert.equal(isAuthorizedAdminToken(null), false);
  assert.equal(isAuthorizedAdminToken({ uid: "admin-uid" }), false);
  assert.equal(isAuthorizedAdminToken({
    email: "aks303603@gmail.com",
    email_verified: "true"
  }), false);
});
