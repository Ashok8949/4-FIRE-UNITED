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
- Tournaments and announcements remain publicly readable; only the configured
  admin can create, update, or delete them.
- Contact messages and challenge registrations remain publicly submittable.
- Only the configured admin can read, update, or delete those submissions.
- Both authenticated non-admin and unauthenticated access are tested against
  existing documents, so denial assertions do not pass merely because a
  document was already deleted.
- Public join applications are restricted to the expected pending schema;
  only the configured admin can read, update, or delete them.
- The public status-check page now sends UID + application email to the
  `lookupJoinApplicationStatus` Cloud Function and receives only status-facing
  fields, rather than querying the private collection directly.

The status lookup function is source code only until explicitly deployed.
Before production deployment, add and configure Firebase App Check enforcement
and abuse/rate limiting for this public endpoint. No function or rules deploy
is performed by this test workflow.

Public contact, join, and challenge submissions now generate admin alerts via
trusted Firestore create triggers in the default Cloud Functions codebase.
Browser clients no longer write notifications; the collection is admin-only.
Deploy the rules and default `functions` codebase together to preserve alerts.

The visitor counter now calls the `countVisitor` Cloud Function instead of
writing Firestore from the browser. The function applies a transactional
per-IP cooldown (one count per 30 minutes), a 20-count UTC-day cap, and stores
only a SHA-256 digest of the source IP in the private `_visitorRateLimits`
collection. The public `stats` collection is read-only under Firestore rules;
the Admin SDK function is the only intended writer.

The rate-limit documents include an `expiresAt` field. Configure Firestore
TTL for `_visitorRateLimits.expiresAt` in the Firebase console to remove
expired records automatically. IP-based limits can affect visitors sharing
a public network and are not a substitute for Firebase App Check. App Check
enforcement should be added before relying on this endpoint for high-risk
traffic. Deploy the updated rules and default Cloud Functions codebase
together; no deployment is performed by this PR.
