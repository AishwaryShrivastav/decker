# Decker launch and activation implementation plan

## 1. Local activation milestones

Create `apps/extension/src/shared/activation.ts` with a versioned storage record and four timestamp-only milestones: key saved, recording started, transcript ready, and output generated. Call it from the background worker after each operation succeeds. Add unit tests proving milestones are idempotent and the record contains no meeting content.

## 2. First-run extension guidance

Update `apps/extension/src/popup/Popup.tsx` so a new user sees the required setup in order. Open key settings when no key exists, show Meet and microphone readiness, link to a Meet test call, and add a feedback action after successful generation. Keep all recording and generation behavior unchanged.

## 3. Activation-first website

Rewrite `apps/web/app/page.tsx` and the landing-page CSS around the closing-room design. Keep the Chrome listing, sample output, privacy, GitHub, and support links. Put install requirements and the first-meeting sequence before secondary outputs. Remove stale pre-launch copy.

Update `apps/web/app/support/page.tsx` with structured setup, first-output, and bug feedback drafts. Update metadata to match the current public release.

## 4. Pilot operations

Add the first-ten-user kit and a public-safe pilot ledger under `gtm/`. Keep personal contact details outside the repository.

## 5. Verification and release

Run extension tests and builds, the Cloudflare Pages build, and TypeScript checks. Review desktop and mobile screenshots, fix visual or accessibility defects, commit, push `main`, wait for the deploy workflow, and verify the live routes and Chrome Web Store CTA.
