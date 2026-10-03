# 4FU 2.0

A non-destructive modernization of the existing 4 FIRE UNITED platform.

## Goal

Keep the current production system working while introducing a professional TypeScript-based frontend and a clean API boundary for gradual migration.

## Migration rules

- `main` remains untouched.
- Existing Firebase Auth, Firestore, FCM, Cloudinary and current Cloud Functions remain the source of truth during migration.
- Features are migrated one module at a time.
- No Firestore collection is renamed or deleted as part of the foundation.
- The old site remains available until the new implementation is verified.

## Target architecture

```
4FU 2.0
├── frontend/       Next.js + TypeScript
├── backend/        Spring Boot API (migration phase)
├── docs/           architecture and migration notes
└── legacy/         existing 4FU remains outside this tree
```

## First migration slice

1. Application shell
2. Firebase compatibility layer
3. Home data
4. Players / profiles
5. Authentication and dashboard
6. Admin
7. Tournaments / challenges
8. Gallery / clips
9. Chat / notifications
10. PRO / payments

The first commit only creates the new application boundary; it does not replace existing pages.
