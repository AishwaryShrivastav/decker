# Decker launch and activation implementation plan

Status: completed on `main` as of September 17, 2026. Version 0.1.3 is in
Chrome Web Store review, so its package and version must remain unchanged unless
Google reports a blocking defect. The public listing continues to serve 0.1.2.

## 1. Local activation milestones: complete

Create `apps/extension/src/shared/activation.ts` with a versioned storage record and four timestamp-only milestones: key saved, recording started, transcript ready, and output generated. Call it from the background worker after each operation succeeds. Add unit tests proving milestones are idempotent and the record contains no meeting content.

## 2. First-run extension guidance: complete

Update `apps/extension/src/popup/Popup.tsx` so a new user sees the required setup in order. Open key settings when no key exists, show Meet and microphone readiness, link to a Meet test call, and add a feedback action after successful generation. Keep all recording and generation behavior unchanged.

## 3. Activation-first website: complete

Rewrite `apps/web/app/page.tsx` and the landing-page CSS around the closing-room design. Keep the Chrome listing, sample output, privacy, GitHub, and support links. Put install requirements and the first-meeting sequence before secondary outputs. Remove stale pre-launch copy.

Update `apps/web/app/support/page.tsx` with structured setup, first-output, and bug feedback drafts. Update metadata to match the current public release.

## 4. Pilot operations: complete

Add the first-ten-user kit and a public-safe pilot ledger under `gtm/`. Keep personal contact details outside the repository.

## 5. Verification and release: complete

Run extension tests and builds, the Cloudflare Pages build, and TypeScript checks. Review desktop and mobile screenshots, fix visual or accessibility defects, commit, push `main`, wait for the deploy workflow, and verify the live routes and Chrome Web Store CTA.

The implementation and release checks are recorded in
[`launch-status.md`](launch-status.md) and
[`../store-assets/verification.md`](../store-assets/verification.md). Google
approval remains the only 0.1.3 publication gate.
