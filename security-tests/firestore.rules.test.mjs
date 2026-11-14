import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const projectId = "demo-4fu-firestore-rules";
const rules = readFileSync(
  fileURLToPath(new URL("../firestore.rules", import.meta.url)),
  "utf8"
);

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules }
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test("website settings are publicly readable", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "settings/website"), {
      siteName: "4 FIRE UNITED"
    });
  });

  await assertSucceeds(
    getDoc(doc(testEnv.unauthenticatedContext().firestore(), "settings/website"))
  );
});

test("only the configured admin email can write website settings", async () => {
  const adminDb = testEnv.authenticatedContext("admin-uid", {
    email: "aks303603@gmail.com",
    email_verified: true
  }).firestore();

  await assertSucceeds(
    setDoc(doc(adminDb, "settings/website"), {
      siteName: "4 FIRE UNITED",
      festival: { enabled: false }
    })
  );
});

test("a different authenticated email cannot write website settings", async () => {
  const userDb = testEnv.authenticatedContext("player-uid", {
    email: "player@example.com",
    email_verified: true
  }).firestore();

  await assertFails(
    setDoc(doc(userDb, "settings/website"), {
      festival: { enabled: true, festival: "diwali" }
    })
  );
});

test("unauthenticated users cannot write website settings", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    setDoc(doc(publicDb, "settings/website"), {
      festival: { enabled: true, festival: "diwali" }
    })
  );
});
