# DiwaliVerse 2026

A standalone, mobile-first Diwali celebration experience inside the 4 FIRE UNITED Firebase Hosting repository.

## Open locally

Because the main Firebase Hosting root is the repository root, the page is available at:

- Local static server: \`/diwaliverse/\`
- Firebase Hosting after a separate approved deployment: \`https://fire-united.web.app/diwaliverse/\`

For a quick local preview, open \`index.html\` directly in a modern browser or run a local static server from the repository root.

## Current milestone: frontend preview

Implemented:
- Premium dark, warm-gold visual direction with responsive layouts.
- Accessible navigation, skip link, visible focus states and reduced-motion support.
- Local diya interaction with a personal visit counter and decorative spark burst.
- Wish composer preview that stays in the current browser.
- Browser-side greeting-card canvas with three palettes and PNG download.
- Share invitation using Web Share API with a clipboard fallback.

Not connected yet:
- The diya counter is not shared across visitors.
- Wish previews are not submitted or published.
- No city map, account system, analytics or live dashboard is connected.
- Sample wishes are illustrative content, not real community submissions.

These limits are stated in the UI. No names or wish text are sent to a server in this milestone.

## Next engineering milestones

1. Add isolated \`/diwali/*\` routes to the existing Cloudflare Worker in \`4fu-freefire-backend/src/index.js\`; do not change existing PRO, Free Fire or YouTube routes.
2. Reuse the existing Worker-to-Firestore service-account pattern only after reviewing its exact permissions and secrets. Do not expose service-account credentials to the browser.
3. Add server-side validation, rate limiting, idempotency and moderation before enabling public wishes.
4. Add a low-cost aggregate counter and bounded public reads; do not create an unbounded real-time listener.
5. Add automated Worker tests and manual mobile/accessibility checks before deployment.

## Safety and cost

- This folder is static and adds no new hosting service or dependency.
- The frontend does not write to Firestore and does not require a Firebase client config.
- Public write endpoints must be protected against spam, duplicate submissions and cost exhaustion before they are enabled.
- Cloudflare and Firebase free-tier quotas can change. Verify current limits in provider dashboards before launch; a free tier is not a guarantee of zero cost if usage exceeds included quotas.
- No Firebase Hosting or Worker deployment is performed by this change.
