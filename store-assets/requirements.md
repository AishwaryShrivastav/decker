# Decker 0.1.4 submission requirements

Version 0.1.4 was packaged, verified, uploaded, and submitted for review on
September 22, 2026. Automatic publication is enabled.

The existing Chrome Web Store item is `khbafeikhdehdhpfcbdlfkpmmikbfihk`.

## Planned files

1. Package: `store-assets/decker-chrome.zip`, rebuilt after the 0.1.4 version bump
2. Store icon: `apps/extension/public/icons/icon128.png`
3. Screenshots, in this order:
   - `store-assets/screenshots/01-popup-single-key.png`
   - `store-assets/screenshots/02-popup-ready.png`
   - `store-assets/screenshots/03-sample-output.png`
4. Small promo tile: `store-assets/promo-440x280.png`
5. Marquee promo tile: `store-assets/marquee-1400x560.png`

The first screenshot shows the real OpenAI or Gemini setup controls with a
masked fictional key. The second shows the browser-tab readiness state and
provider disclosure. The third uses the checked-in fictional sample artifact.
No screenshot contains a real API key, account data, or meeting content.

## Before packaging

- [x] Confirm the working tree contains only approved release changes.
- [x] Review the website at desktop and mobile widths.
- [x] Confirm the privacy page describes validation probes, direct provider
  processing, Gemini temporary uploads, awaited deletion, three cleanup retries,
  cleanup warnings, and local recovery storage.
- [x] Confirm the support page asks for the browser, provider, meeting service,
  mute state, permissions, and exact error text.
- [x] Confirm the Store title and short description match `manifest.json`.
- [x] Confirm no public copy promises native-app capture, fixed cost, fixed
  timing, perfect accuracy, or guaranteed provider deletion.

## Task 5 package checks

- [x] Bump the extension and manifest versions to 0.1.4.
- [x] Update `CHANGELOG.md`.
- [x] Build the extension.
- [x] Regenerate `store-assets/decker-chrome.zip`.
- [x] Update `scripts/verify-extension.py` for both provider origins and the
  review page.
- [x] Run the extension tests and TypeScript check.
- [x] Build the website and extension.
- [x] Run ZIP verification and confirm the recorded SHA-256.
- [ ] Complete manual OpenAI and Gemini checks.
- [ ] Complete capture checks on more than one browser meeting service.

## Store dashboard

- [x] Upload the final 0.1.4 ZIP to the existing item.
- [x] Paste the title and descriptions from [listing.md](listing.md).
- [x] Set category to Workflow & Planning, language to English, pricing to free,
  visibility to public, regions to all, and mature content to off.
- [x] Set the homepage, support, and privacy URLs.
- [x] Confirm the icon, three screenshots, small tile, and marquee tile are present.
- [x] Paste the single-purpose statement and every permission justification from
  [submission-fields.md](submission-fields.md).
- [x] Select the five documented user-data categories.
- [x] Read and check the three Limited Use certifications.
- [x] Select `No, I am not using remote code`.
- [x] Paste the reviewer notes and save every dashboard section.

## Final review

- [x] Confirm the dashboard package version is 0.1.4.
- [x] Confirm the permissions diff contains the documented OpenAI and Gemini
  host permissions and no unexplained permission.
- [x] Confirm the package contains no keys, meeting content, `.env` files,
  source maps, or macOS metadata.
- [x] Re-open every dashboard section and resolve each validation error.
- [x] Submit after owner approval. Dashboard status: `Pending review`.

Official references:

- https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/review-process
- https://developer.chrome.com/docs/webstore/program-policies/privacy
- https://developer.chrome.com/docs/webstore/program-policies/limited-use
