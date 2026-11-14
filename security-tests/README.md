# Firestore Rules Tests

This isolated test package runs the repository's `firestore.rules` against the
Firebase Local Emulator Suite. It does not connect to or modify production
Firebase data.

## Run locally

Requirements: Node.js 22 and Java 21.

```sh
npm install --prefix security-tests
npx --yes firebase-tools emulators:exec --project demo-4fu-firestore-rules --only firestore "npm test --prefix security-tests"
```

## Current coverage

- Website settings remain publicly readable; only the configured admin email
  can write them.
- Contact messages and challenge registrations remain publicly submittable.
- Only the configured admin can read, update, or delete those submissions.
- Both authenticated non-admin and unauthenticated access are tested against
  existing documents, so denial assertions do not pass merely because a
  document was already deleted.

Other legacy collection permissions are not covered yet. In particular,
`joinApplications`, `stats`, and `notifications` still need dedicated
workflow-aware security work before their rules can be tightened safely.
