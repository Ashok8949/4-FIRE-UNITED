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
- The public status-check page calls the `lookupJoinApplicationStatus` Cloud
  Function and receives only status-facing fields, rather than querying the
  private collection directly.
- Visitor counter handler tests cover first count, cooldown boundaries, daily
  cap, UTC rollover, missing IP/method rejection, hashed-IP-only storage,
  malformed counter values, and database failures.
- Admin account provisioning tests verify that only the configured,
  email-verified administrator token is accepted.
- Public Free Fire profile lookup and application-status endpoints use
  transactional per-IP/per-endpoint limits (15 and 5 requests per minute).
  The IP key is HMAC-SHA-256 hashed with the server-only secret.

## Required production configuration (not performed by CI)

### Visitor IP HMAC secret

The visitor counter uses HMAC-SHA-256 so stored rate-limit keys cannot be
tested against guessed IP addresses without the server-side secret. Before
deploying the default Cloud Functions codebase, generate a random secret of at
least 32 characters and set it in the Firebase project:

```sh
openssl rand -hex 32
firebase functions:secrets:set VISITOR_IP_HASH_SECRET
```

Paste the generated value only into the interactive Firebase CLI prompt.
Do not commit it, put it in frontend code, or send it in chat. The
`countVisitor` function is intentionally fail-closed if the secret is absent.

### Firestore TTL

Rate-limit documents include an `expiresAt` timestamp, but that field alone
does not activate automatic deletion. Enable Firestore TTL for collection
groups `_visitorRateLimits` and `publicApiRateLimits`, field `expiresAt`, in the Firebase / Google Cloud
console (Firestore > Time-to-live). TTL deletion is asynchronous and is not
part of the request-time rate-limit enforcement.

### Firebase App Check

App Check is not yet enforced on the public HTTP endpoints. Enabling it
requires registering the actual 4FU web app with an appropriate provider,
configuring the resulting site key in the website, initializing the App Check
client, sending App Check tokens to the relevant HTTP functions, and then
verifying those tokens server-side. Do not enable server enforcement until
the real site key and client integration are configured and verified; a
placeholder key would break legitimate traffic. Public status lookup and Free Fire profile lookup now have transactional
per-IP/per-endpoint rate limits. App Check remains recommended as an
additional abuse-control layer before production reliance.

## Deployment order and scope

The visitor counter and public API rate limits use the same private HMAC
secret. Set that secret before deploying the default Cloud Functions codebase. Deploy the updated Firestore
rules and default Cloud Functions codebase together so public clients cannot
write visitor stats while the new endpoint is available. Configure TTL
separately as above. No function, rules, hosting, or production data deploy is
performed by this test workflow.


## Public form submission security

Contact, challenge and join forms use HTTPS Cloud Functions
`submitContactMessage`, `submitChallengeRegistration` and
`submitJoinApplication`. Endpoints enforce strict field allowlists, length
and format validation, an 8 KiB request body ceiling, three submissions per
10 minutes per IP and endpoint, and idempotency keys for request retries.
Firestore client-side creates for these collections are denied; Admin SDK
writes continue to activate the existing trusted admin notification triggers.

Before deployment, set `VISITOR_IP_HASH_SECRET` in Firebase Functions Secret
Manager (at least 32 random bytes); never commit or share the secret. Enable
Firestore TTL on `publicApiRateLimits.expiresAt` and
`publicSubmissionKeys.expiresAt`. TTL cleanup is asynchronous and not part
of request-time enforcement. Deploy updated Functions and Firestore rules
together so new endpoints are active as direct client writes are disabled.
