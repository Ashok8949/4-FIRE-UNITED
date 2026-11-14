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

test("visitor statistics are publicly readable but cannot be client-written", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "stats/visitors"), { total: 12 });
  });

  const publicDb = testEnv.unauthenticatedContext().firestore();
  const user = userDb();
  const admin = adminDb();
  const publicRef = doc(publicDb, "stats/visitors");
  const userRef = doc(user, "stats/visitors");
  const adminRef = doc(admin, "stats/visitors");

  await assertSucceeds(getDoc(publicRef));
  await assertSucceeds(getDoc(userRef));
  await assertSucceeds(getDoc(adminRef));

  await assertFails(setDoc(doc(publicDb, "stats/anonymous-write"), { total: 999 }));
  await assertFails(updateDoc(publicRef, { total: 999 }));
  await assertFails(updateDoc(userRef, { total: 999 }));
  await assertFails(updateDoc(adminRef, { total: 999 }));
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
test("an unverified account using the admin email cannot write website settings", async () => {
  const unverifiedAdmin = testEnv.authenticatedContext("unverified-admin", {
    email: "aks303603@gmail.com",
    email_verified: false
  }).firestore();
  await assertFails(setDoc(doc(unverifiedAdmin, "settings/website"), {
    festival: { enabled: false }
  }));
});

test("players can edit profile fields but cannot change account identity or admin fields", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "players", "player-profile"), {
      loginEmail: "player@example.com", authUid: "player-uid", role: "Player",
      displayOrder: 4, since: "2024", featured: false, name: "Old Name", ign: "OldIGN"
    });
  });
  const profileRef = doc(userDb(), "players", "player-profile");
  await assertSucceeds(updateDoc(profileRef, {
    name: "New Name", ign: "NewIGN", loginEmail: "player@example.com",
    authUid: "player-uid", role: "Player", displayOrder: 4, since: "2024", featured: false
  }));
  await assertFails(updateDoc(profileRef, { authUid: "attacker-uid" }));
  await assertFails(updateDoc(profileRef, { role: "Administrator" }));
  await assertFails(updateDoc(profileRef, { displayOrder: 999 }));
  await assertFails(updateDoc(profileRef, { loginEmail: "victim@example.com" }));
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


test("public applicants can create only pending, schema-valid applications", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();
  const validApplication = {
    name: "Test Player",
    ign: "TestIGN",
    uid: "123456789",
    email: "player@example.com",
    level: "50",
    rank: "Heroic",
    about: "Test application",
    status: "Pending",
    appliedOn: "14/11/2026"
  };

  await assertSucceeds(
    setDoc(doc(publicDb, "joinApplications", "valid-public-application"), validApplication)
  );
  await assertFails(
    setDoc(doc(publicDb, "joinApplications", "invalid-public-status"), {
      ...validApplication,
      status: "Accepted"
    })
  );
  await assertFails(
    setDoc(doc(publicDb, "joinApplications", "invalid-public-uid"), {
      ...validApplication,
      uid: "not-a-uid"
    })
  );
  await assertFails(
    setDoc(doc(publicDb, "joinApplications", "extra-admin-field"), {
      ...validApplication,
      adminApproved: true
    })
  );
});

test("only admin can read, update or delete existing join applications", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "joinApplications", "private-application"), {
      uid: "123456789",
      status: "Pending"
    });
  });

  const admin = adminDb();
  const user = userDb();
  const adminRef = doc(admin, "joinApplications", "private-application");
  const userRef = doc(user, "joinApplications", "private-application");
  const publicRef = doc(testEnv.unauthenticatedContext().firestore(), "joinApplications", "private-application");

  await assertFails(getDoc(userRef));
  await assertFails(updateDoc(userRef, { status: "Accepted" }));
  await assertFails(deleteDoc(userRef));
  await assertFails(getDoc(publicRef));
  await assertFails(updateDoc(publicRef, { status: "Accepted" }));
  await assertFails(deleteDoc(publicRef));

  await assertSucceeds(getDoc(adminRef));
  await assertSucceeds(updateDoc(adminRef, { status: "Accepted" }));
  await assertSucceeds(deleteDoc(adminRef));
});


test("notifications are private and writable only by the configured admin", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();
  const user = userDb();
  const admin = adminDb();

  await assertFails(setDoc(doc(publicDb, "notifications", "anonymous-create"), { title: "Fake alert" }));
  await assertFails(setDoc(doc(user, "notifications", "user-create"), { title: "Fake alert" }));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "notifications", "private-alert"), {
      title: "Trusted alert",
      isRead: false
    });
  });

  const publicRef = doc(publicDb, "notifications", "private-alert");
  const userRef = doc(user, "notifications", "private-alert");
  const adminRef = doc(admin, "notifications", "private-alert");

  await assertFails(getDoc(publicRef));
  await assertFails(getDoc(userRef));
  await assertFails(updateDoc(userRef, { isRead: true }));
  await assertFails(deleteDoc(userRef));
  await assertFails(updateDoc(publicRef, { isRead: true }));
  await assertFails(deleteDoc(publicRef));

  await assertSucceeds(getDoc(adminRef));
  await assertSucceeds(updateDoc(adminRef, { isRead: true }));
  await assertSucceeds(deleteDoc(adminRef));
  await assertSucceeds(setDoc(doc(admin, "notifications", "admin-create"), { title: "Admin alert" }));
});


for (const collectionName of ["tournaments", "announcements"]) {
  test(`${collectionName} remain publicly readable but writes are admin-only`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), collectionName, "existing-public-item"), {
        title: "Public item"
      });
    });

    const publicDb = testEnv.unauthenticatedContext().firestore();
    const user = userDb();
    const admin = adminDb();
    const publicRef = doc(publicDb, collectionName, "existing-public-item");
    const userRef = doc(user, collectionName, "existing-public-item");
    const adminRef = doc(admin, collectionName, "existing-public-item");

    await assertSucceeds(getDoc(publicRef));
    await assertSucceeds(getDoc(userRef));
    await assertFails(setDoc(doc(publicDb, collectionName, "anonymous-create"), { title: "No" }));
    await assertFails(setDoc(doc(user, collectionName, "user-create"), { title: "No" }));
    await assertFails(updateDoc(userRef, { title: "Tampered" }));
    await assertFails(deleteDoc(userRef));
    await assertFails(updateDoc(publicRef, { title: "Tampered" }));
    await assertFails(deleteDoc(publicRef));

    await assertSucceeds(setDoc(doc(admin, collectionName, "admin-create"), { title: "Admin" }));
    await assertSucceeds(updateDoc(adminRef, { title: "Admin update" }));
    await assertSucceeds(deleteDoc(adminRef));
  });
}
