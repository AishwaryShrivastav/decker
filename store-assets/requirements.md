# Submit Decker 0.1.3 today

This is the ordered checklist for the existing Chrome Web Store item
`khbafeikhdehdhpfcbdlfkpmmikbfihk`. Stop before the final Submit for Review
button if another person is preparing the draft.

## Files to upload

1. Package: `store-assets/decker-chrome.zip`
2. Store icon: `apps/extension/public/icons/icon128.png`
3. Screenshots, in this order:
   - `store-assets/screenshots/01-popup-single-key.png`
   - `store-assets/screenshots/02-popup-ready.png`
   - `store-assets/screenshots/03-sample-output.png`
4. Small promo tile: `store-assets/promo-440x280.png`
5. Marquee promo tile: `store-assets/marquee-1400x560.png`

The existing screenshots show the real extension setup, ready state, and a
sample output. Version 0.1.3 adds a first-meeting checklist and feedback button;
the main capture and output experience shown in these screenshots is unchanged.
Do not upload a screenshot containing a real API key or private meeting content.

## Before opening the dashboard

- [ ] Pull `main` and confirm the working tree is clean.
- [ ] Run `bash scripts/package-extension.sh chrome`.
- [ ] Run `python3 scripts/verify-extension.py`.
- [ ] Confirm the ZIP SHA-256 printed in `store-assets/verification.md` matches
  the file being uploaded.
- [ ] Open https://decker.techforgood.studio/privacy and confirm it states that
  Decker requests no broad `tabs` permission and no persistent Meet access.
- [ ] Open https://decker.techforgood.studio/support and confirm it loads.
- [ ] Confirm the public listing still shows 0.1.2 before uploading the update.

## Package upload

- [ ] Open the existing item in the Chrome Web Store Developer Dashboard.
- [ ] Upload `store-assets/decker-chrome.zip` as the new package.
- [ ] Confirm the dashboard reads version 0.1.3.
- [ ] Confirm the permissions diff contains only the permissions documented in
  [submission-fields.md](submission-fields.md).
- [ ] Save the draft.

## Store listing tab

- [ ] Paste the title, short description, and detailed description from
  [listing.md](listing.md).
- [ ] Change the category from Developer Tools to Workflow & Planning.
- [ ] Set language to English.
- [ ] Set the homepage URL to https://decker.techforgood.studio.
- [ ] Set the support URL to https://decker.techforgood.studio/support.
- [ ] Choose https://decker.techforgood.studio as the Official URL if it is
  available. If it is absent, verify the domain in Google Search Console later;
  this does not block submission.
- [ ] Keep mature content off.
- [ ] Upload the 128x128 icon.
- [ ] Upload the three screenshots in the listed order.
- [ ] Upload the 440x280 small promo tile.
- [ ] Upload the optional 1400x560 marquee tile.
- [ ] Leave promotional video blank. A video is optional.
- [ ] Save the draft.

## Privacy tab

- [ ] Paste the single-purpose statement from
  [submission-fields.md](submission-fields.md).
- [ ] Paste each permission justification into its matching field.
- [ ] Select `No, I am not using remote code`.
- [ ] Select the five data categories listed in the submission fields:
  personally identifiable information, authentication information, personal
  communications, website content, and user activity.
- [ ] Read and check all three Limited Use certifications.
- [ ] Set the privacy policy URL to
  https://decker.techforgood.studio/privacy.
- [ ] Save the draft.

## Test instructions tab

- [ ] Mark account credentials as not required.
- [ ] Paste the reviewer notes from
  [submission-fields.md](submission-fields.md).
- [ ] Do not place a personal OpenAI key in reviewer notes or the package.
- [ ] Save the draft.

## Distribution tab

- [ ] Public visibility.
- [ ] Free of charge.
- [ ] All regions.
- [ ] Save the draft.

## Final review before submission

- [ ] Re-open every tab and confirm there are no dashboard errors.
- [ ] Confirm title and summary match `manifest.json`.
- [ ] Confirm the privacy tab includes local user activity introduced in 0.1.3.
- [ ] Confirm no Store text promises a fixed generation time, cost, accuracy, or
  privacy behavior that the package does not provide.
- [ ] Confirm the package contains no API keys, meeting content, `.env` files,
  source maps, or macOS metadata.
- [ ] Choose the dashboard publishing timing. Immediate publication is the
  simplest option for this update.
- [ ] Click Submit for Review only when the owner is ready.

Google says most reviews finish within a few days, while some take a few weeks.
Contact Developer Support if the update remains pending for more than three
weeks.

Official references checked September 17, 2026:

- https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/review-process
- https://developer.chrome.com/docs/webstore/program-policies/privacy
- https://developer.chrome.com/docs/webstore/program-policies/limited-use
