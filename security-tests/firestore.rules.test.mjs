import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";

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

const adminDb = () => testEnv.authenticatedContext("admin-uid", {
  email: "aks303603@gmail.com",
  email_verified: true
}).firestore();

const userDb = () => testEnv.authenticatedContext("player-uid", {
  email: "player@example.com",
  email_verified: true
}).firestore();

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
  await assertSucceeds(
    setDoc(doc(adminDb(), "settings/website"), {
      siteName: "4 FIRE UNITED",
      festival: { enabled: false }
    })
  );
});

test("a different authenticated email cannot write website settings", async () => {
  await assertFails(
    setDoc(doc(userDb(), "settings/website"), {
      festival: { enabled: true, festival: "diwali" }
    })
  );
});

test("unauthenticated users cannot write website settings", async () => {
  await assertFails(
    setDoc(doc(testEnv.unauthenticatedContext().firestore(), "settings/website"), {
      festival: { enabled: true, festival: "diwali" }
    })
  );
});

for (const collectionName of ["contactMessages", "challengeRegistrations"]) {
  test(`public users can submit ${collectionName} records`, async () => {
    await assertSucceeds(
      setDoc(doc(testEnv.unauthenticatedContext().firestore(), collectionName, "public-submit"), {
        submitted: true
      })
    );
  });

  test(`only admin can read, update or delete existing ${collectionName} records`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), collectionName, "private-record"), {
        submitted: true
      });
    });

    const admin = adminDb();
    const user = userDb();
    const adminRef = doc(admin, collectionName, "private-record");
    const userRef = doc(user, collectionName, "private-record");

    // Verify non-admin denial while the document still exists.
    await assertFails(getDoc(userRef));
    await assertFails(updateDoc(userRef, { reviewed: true }));
    await assertFails(deleteDoc(userRef));

    // Verify the same operations are permitted for the configured admin.
    await assertSucceeds(getDoc(adminRef));
    await assertSucceeds(updateDoc(adminRef, { reviewed: true }));
    await assertSucceeds(deleteDoc(adminRef));
  });

  test(`unauthenticated users cannot read, update or delete ${collectionName} records`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), collectionName, "anonymous-private-record"), {
        submitted: true
      });
    });

    const publicDb = testEnv.unauthenticatedContext().firestore();
    const publicRef = doc(publicDb, collectionName, "anonymous-private-record");
    await assertFails(getDoc(publicRef));
    await assertFails(updateDoc(publicRef, { reviewed: true }));
    await assertFails(deleteDoc(publicRef));
  });
}
