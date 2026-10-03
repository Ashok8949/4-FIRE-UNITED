# 4FU 2.0 — Players & Profiles

The new roster reads directly from the existing `players` Firestore collection.

## Preserved

- Existing Firestore document IDs
- `featured`
- `displayOrder`
- Owner-first ordering
- Player UID, role, guild, rank and game statistics
- Favorite weapon fields
- Social links

Profiles are available at:

`/players/{existing-player-document-id}`

No legacy player page or Firestore document is deleted or renamed.
