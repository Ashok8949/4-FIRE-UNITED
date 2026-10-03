# 4FU 2.0 Migration Plan

## Compatibility-first strategy

The current 4FU implementation contains production features across Firebase Auth, Firestore, FCM, Cloud Functions and Cloudinary. The migration therefore uses a strangler-style approach: the new application consumes the existing services first, then selected domains can move behind a Spring Boot API and PostgreSQL later.

## Existing Firestore domains to preserve

- players
- tournaments
- gallery
- clips
- contactMessages
- joinApplications
- announcements
- notifications
- chat
- fcmTokens
- challengeRegistrations
- settings
- stats
- proSubscriptions

## Non-breaking rule

No migration step should require deleting or renaming an existing collection, changing public URLs, or removing a working feature.

## Immediate next implementation

Create a typed Firebase data layer in the Next.js app:

- players repository
- tournaments repository
- gallery repository
- clips repository
- announcements repository
- notifications repository
- chat repository

Then migrate the public Home page and Player/Profile pages against those repositories before touching Admin or PRO.
