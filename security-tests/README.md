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

The initial suite protects the website-settings authorization boundary:
public reads remain available, while writes require the configured admin
email. Additional collection rules should receive explicit authorization tests
before their permissions are tightened; broad legacy permissions elsewhere in
`firestore.rules` are intentionally not changed by this test-only addition.
