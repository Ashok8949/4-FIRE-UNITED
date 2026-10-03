# 4FU 2.0 — Home Migration

The first feature slice connects the new Next.js frontend to the existing Firebase project.

## Existing collections used

- `players` — featured players
- `clips` — latest gameplay clips
- `announcements` — latest announcement
- `tournaments` — latest tournament
- `stats/visitors` — visitor counter

## Compatibility rule

No collection, document shape, authentication flow, or existing page was renamed or deleted.

The 2.0 frontend reads the same Firestore data used by the legacy site. This allows the new UI to be tested against real production-shaped data before replacing the legacy page.

## Next slice

Players and player profiles will reuse the same `players` collection and preserve existing profile IDs so existing links continue to resolve.
