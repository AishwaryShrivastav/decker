# Chrome Web Store submission checklist

The zip and copy can be prepared locally. This checklist does not assert that
the product is approved or that all store requirements have been met.

## Prepared in this worktree

- [x] Corrected landing page, metadata, privacy policy, store listing, and extension disclosures.
- [x] Documented actual data flow, local storage, output requests, and declared permissions in [privacy.md](privacy.md).
- [x] Generated 16x16, 48x48, and 128x128 PNG icons from `apps/web/public/logo.png`.
- [x] Generated a 440x280 opaque RGB promotional tile from the same brand asset.
- [x] Package verifier: `python3 scripts/verify-extension.py` checks archive/build equality, manifest paths, icon dimensions, and tile format.
- [x] Rebuildable submission package: `bash scripts/package-extension.sh chrome` writes `store-assets/decker-chrome.zip`.

## Owner action before submission

- [ ] Publish the corrected website privacy policy and landing copy, then verify
  the public URL matches this revision. No deployment is part of this task.
- [ ] Verify website hosting logs, retention, any injected analytics, and support
  email retention. Update the policy with operational details as needed. The
  separate web APIs must not be described as direct browser-to-OpenAI processing.
- [ ] Resolve the permission audit: justify or remove `tabs` redundancy and the
  unused Meet content-script/host access. Test capture after any removal, rebuild,
  and rerun package verification. Do not invent permission justifications.
- [ ] Review key and log protection against Chrome's secure-handling requirements.
  Current storage has no application-level encryption; logs can contain topic
  text and API response details. Copy changes do not remediate storage security.
- [ ] Review generated HTML code and external resources for the remote-code
  declaration. Bundled extension entry scripts are local, but Open HTML opens
  model-generated HTML in a blob tab and outputs can reference external scripts.
  Do not certify a blanket "no remote code" answer without resolving this behavior
  against the current store rules. Include the behavior in reviewer notes.
- [ ] Capture at least one actual screenshot of the updated extension, 1280x800
  or 640x400, without exposing keys or private meeting content. The three existing
  1280x800 files in `screenshots/` are legacy assets whose provenance and current
  accuracy are unverified. Do not upload them merely because their sizes pass.
- [ ] Run a consented live recording/generation test with an owner-provided key;
  confirm microphone fallback, OpenAI requests, downloads, and current disclosures.
  No live audio or paid API calls were used for this revision.
- [ ] Register or verify the owner's developer account and complete Google's
  current registration, identity, payment, and account-security steps.

## Privacy practices dashboard

- [ ] Single purpose: "Record the active Google Meet tab and turn its transcript
  into a meeting deliverable: notes, deck, prototype, or discussion site."
- [ ] Explain each declared permission using [privacy.md](privacy.md), after the
  permission issues above are resolved.
- [ ] Declare OpenAI transmission and local handling. The absence of developer
  telemetry is not a reason to mark all data categories unchecked.
- [ ] Map the actual data to the current dashboard categories. Authentication
  information covers the API key; personal communications cover meeting audio
  and transcripts. Website content covers captured Meet content and user-entered
  text; web history/browsing activity needs review for the locally read active-tab
  URL. Review personally identifiable, health, financial, location, and other
  categories for information that can occur in meeting content, without claiming
  dedicated collection of fields the extension does not access.
- [ ] Explain purposes: transcription, topic extraction/context, output generation,
  and local troubleshooting. Explain OpenAI as the processing recipient, local
  storage/download retention, and user-initiated support sharing.
- [ ] Owner must attest to the data-use certifications (including sale, unrelated
  use/transfer, creditworthiness, and Limited Use) only after checking actual
  business and provider practices. Add any required Limited Use statement to the
  public policy after verifying it. This revision does not make that attestation.
- [ ] Set privacy URL to https://decker.techforgood.studio/privacy and verify it
  is publicly accessible, accurate, and consistent with the dashboard.

## Upload and release

- [ ] Confirm the manifest version is suitable for the existing listing, if any.
- [ ] Upload `store-assets/decker-chrome.zip`, use [listing.md](listing.md), and
  upload `promo-440x280.png` plus verified screenshots. Google reviews artwork;
  local dimension checks do not imply approval.
- [ ] Set distribution, pricing, category, and support details; submit from the
  owner's account when the checks above are complete.
- [ ] After approval, replace early-access/generic store links with the real listing
  URL. Do not claim Chrome Web Store availability before approval.

References checked September 14, 2026:
[image requirements](https://developer.chrome.com/docs/webstore/images),
[privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy),
and [user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
