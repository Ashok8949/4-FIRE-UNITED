# 4FU 2.0 — Player Auth & Dashboard

Implemented on branch 4fu-2.0.

- Firebase Email/Password authentication
- Local browser persistence
- Existing password reset flow
- Player resolution by players.authUid, then players.loginEmail
- Existing players documents are not renamed or deleted
- Browser FCM token registration uses the existing fcmTokens collection
- Existing Firebase Functions notification pipeline remains untouched

## Routes

- /player-login
- /dashboard

The original player-login.html and player-dashboard.html remain untouched.

For compatibility, Live Chat and My Content currently open the existing dashboard. They will be moved into the new 2.0 dashboard in a later migration step so no working feature is lost.
