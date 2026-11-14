# 4FU Master Website Control Center — Repository Audit

**Audit date:** 2026-11-14  
**Repository:** `Ashok8949/4-FIRE-UNITED`  
**Target branch:** `feature/festive-universe`  
**Audited branch HEAD:** `112d43613f8e4bc5054066a3e49008a93b45c9e8`  
**Default branch:** `main` (not modified)  
**Scope:** Read-only repository and architecture audit. No application source, Firebase data, rules, or deployment configuration changed during this audit.

## 1. Repository shape

The target branch is present and accessible. The repository is a large static multi-page website with Firebase-backed data and a separate admin area. The recursive Git tree contains 465 entries.

Important areas:

- Public pages at repository root: `index.html`, `team.html`, `tournaments.html`, `gallery.html`, `clips.html`, `player-*.html`, `pro*.html`, `challenges.html`, and other pages.
- Public styles: `CSS/`
- Public scripts: `js/`
- Admin pages: `admin/`
- Admin scripts and Firebase client: `admin/js/`
- Firestore rules: `firestore.rules`
- Firebase Hosting and Functions configuration: `firebase.json`
- Existing festival regression tests: `security-tests/festive-universe.test.mjs`
- Additional backend projects/codebases: `functions/`, `firebase-functions/`, and `4fu-freefire-backend/`.

The root `package.json` does not define a usable test/build pipeline (its test command intentionally exits with “no test specified”). The Cloudflare worker package has a Vitest test script. Firebase Functions are configured as separate codebases in `firebase.json`.

## 2. Existing admin and settings architecture

The current admin panel is a set of standalone HTML pages using shared Firebase compat SDK initialization and an admin login flow.

Relevant files:

- `admin/settings.html`
- `admin/js/settings.js`
- `admin/js/firebase.js`
- `admin/js/auth-guard.js`
- `admin/js/login.js`
- `admin/CSS/dashboard.css`

The existing Settings page already edits the Firestore document:

`settings/website`

Current editable fields include:

- `teamName`
- `email`, `phone`, `address`
- `logo`
- `heroTitle`, `heroSubtitle`
- Instagram, YouTube, Discord and Facebook links
- A nested `festival` configuration.

The current settings save uses a Firestore transaction and merges existing top-level settings and nested festival fields. This is an important preservation behavior: future Studio saves must retain unknown/unrelated fields and must never replace the whole document with a partial form payload.

The admin login page currently checks an email allowlist. Firestore rules separately restrict settings writes to a verified admin email. The shared auth guard currently checks whether a user is signed in; it does not itself repeat the email allowlist check. Any new Studio page must follow the existing login flow and rely on Firestore authorization as the security boundary, with an explicit admin guard improvement considered before exposing additional management actions.

## 3. Existing festival implementation

The festival experience is already partially implemented:

- `js/festive-universe.js`: festival selection, manual/scheduled activation, time-boundary timer, read-only query-string preview, particles, welcome toast, intro and decorative DOM elements.
- `CSS/festive-universe.css`: particle effects, ambient lighting, diya/rangoli, toast and intro presentation.
- `js/festive-art-direction.js` and `CSS/festive-art-direction.css`: festival-specific loader copy and broader public-site visual skin.
- `admin/settings.html` and `admin/js/settings.js`: festival enable/disable, manual/scheduled mode, one selected festival, India-local start/end fields, and preview link.
- `security-tests/festive-universe.test.mjs`: tests for manual activation, scheduled boundaries, malformed schedules, preview isolation, reduced motion, and once-per-session welcome behavior.

Current built-in festival IDs are:

`diwali`, `holi`, `eid`, `christmas`, `newyear`, `independence`, `halloween`.

The current model is a single active festival configuration under `settings/website.festival`, not a full festival library/calendar with independently saved presets, assets, per-page overrides, animation controls, draft/publish, or rollback. The existing preview is a read-only public preview URL and should remain non-publishing.

## 4. Current branding and loader limitations

The public settings loader (`js/settings-loader.js`) applies a subset of the settings document to elements matching `.team-name` and `.logo img`, plus hero and contact/social elements when matching IDs exist.

Branding is not yet fully centralized:

- The homepage document title is hardcoded in `index.html`.
- The homepage favicon and preload logo are hardcoded paths.
- The current admin sidebar branding is hardcoded in admin HTML.
- Many page headings, labels and brand strings remain literal HTML.
- The current logo setting changes matching public logo images only where the settings loader is included and matching selectors exist.

The current public loader is a fixed bullet/impact/logo animation. Its timing and presentation are defined in `js/loader.js` and `CSS/loader.css`; it is not yet driven by an admin-managed loader configuration.

Therefore a brand rename cannot yet be guaranteed to update every public page, browser metadata, all admin chrome, email templates, generated messages or social preview metadata. A central runtime brand configuration plus a controlled migration of references is required. Historical records and user-generated content must not be rewritten as part of a brand change.

## 5. Firebase and data safety observations

- Public and admin Firebase client initialization point to the existing `fire-united` Firebase project.
- `firestore.rules` permits public reads of `settings` documents and restricts writes to the verified admin email.
- Because the settings document is publicly readable, it must contain only public presentation/business information. API secrets, payment credentials, private integration tokens and other secrets must never be placed in `settings/website`.
- Existing settings updates should use transactional read/merge/write semantics or a safe field-scoped update. No migration should reset or delete existing settings.
- Firebase rules, Functions, payment code, authentication, player records, tournaments, gallery, clips, challenges and PRO data are outside the first visual-management migration and must remain unchanged unless a separately reviewed requirement needs them.

## 6. Recommended target architecture

Build the Control Center incrementally on top of the existing admin panel and preserve backward compatibility with `settings/website`.

Recommended public configuration shape (illustrative; finalize against actual consumers before implementation):

- `brand`: public name, short name, tagline, logo variants, favicon, public contact/social links and metadata.
- `experience`: active theme, tokens, typography, backgrounds, component styling and motion preferences.
- `festivalLibrary`: reusable festival definitions and per-festival design/asset/effect configuration.
- `festivalSchedule`: activation mode, selected festival, start/end boundaries, priority and manual override.
- `loader`: loader preset, logo, copy, background and timing.
- `pages` / `components`: allowlisted page/component overrides and visibility controls.
- `publishing`: draft/published version identifiers and timestamps; avoid copying secrets or untrusted executable code.

The schema must be versioned, validated, size-limited and allowlisted. Admin inputs should be treated as data, never injected as arbitrary HTML/JavaScript/CSS. Uploaded assets should use the existing approved storage path after confirming the project's Storage configuration and rules.

## 7. Implementation sequence

1. **P0 — Audit (this document):** identify current architecture, extension points and protected systems.
2. **P1 — Safe Studio foundation:** admin navigation entry, dedicated Studio shell, admin authorization, schema validator, transactional configuration service, draft/publish and audit/version records.
3. **P2 — Brand Identity Manager:** central public brand config and consistent application to shared site chrome, page titles, favicon and supported metadata.
4. **P3 — Festival Experience Studio:** festival library, presets, scheduling, manual override, page scope, visual preview and migration from the existing single-festival config without breaking it.
5. **P4 — Theme and component controls:** design tokens, global/page/component overrides and responsive preview.
6. **P5 — Animation and Loader studios:** independent toggles/intensity/performance controls and configurable loader presets.
7. **P6 — Asset and Content managers:** safe asset upload/selection and allowlisted editable content.
8. **P7 — Regression and release readiness:** test existing festival behavior, Firestore merge behavior, auth/rules, public pages and critical existing features. Deploy only after explicit release approval.

## 8. Non-negotiable safeguards

- All work stays on `feature/festive-universe`; never write to `main`.
- Preserve the existing settings document and all unknown fields.
- Do not alter Firebase project configuration, payment secrets, auth flows or production data as part of visual configuration work.
- Keep the existing festival preview read-only.
- Respect reduced-motion preferences and provide effect/performance controls.
- Use allowlisted page/component identifiers; do not let admin-entered data execute code.
- Maintain backward compatibility while migrating current festival settings.
- Each implementation task must include tests and a clear changed-files/verification report.
- Do not claim runtime/build tests passed unless they were actually executed in a suitable environment.

## 9. Audit conclusion

The repository already has a useful foundation: an admin Settings page, a public Firestore settings document with transactional merge behavior, a working festival scheduler/preview, festival CSS/JS, and targeted festival tests.

However, it does **not** yet contain the locked Master Website Control Center. The safest path is to evolve the current settings system in small, complete phases rather than replace it. The first implementation task should be the P1 safe Studio foundation, with the existing festival scheduler kept operational throughout.
