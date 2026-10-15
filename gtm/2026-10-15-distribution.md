# Decker distribution check — October 15, 2026

## Goal and observable baseline

Target: 50 **external users** of the free, open-source BYOK Chrome extension. A Store user count is an install/distribution signal, not proof that a user saved a key, recorded a meeting, or generated a useful output. Do not count the developer's own installations as external users.

- [Public Chrome Web Store listing](https://chromewebstore.google.com/detail/decker-browser-meeting-no/khbafeikhdehdhpfcbdlfkpmmikbfihk): public, version **0.1.4**, updated **September 23, 2026**, **3 users**, **no ratings** when checked October 15. The listing describes OpenAI or Gemini BYOK and links to privacy, support, and source. The earlier `docs/launch-status.md` record that 0.1.4 was pending review is now stale.
- [Website](https://decker.tfgstudio.com): the old `decker.techforgood.studio` domain redirects to this canonical domain. Home, demo, privacy, and support routes returned HTTP 200 on October 15. The home page still links to the Store listing.
- [GitHub repository](https://github.com/AishwaryShrivastav/decker): public MIT source. The repository had no homepage metadata before this pass. The GitHub traffic API returned zero views for its available recent window; that is a repository metric, not a Store install or activation metric.
- Opt-in measurement: the published source records four timestamp-only milestones in local extension storage (`key_saved`, `recording_started`, `transcript_ready`, `output_generated`). It sends no automatic meeting-content telemetry to the developer. The review page offers an email feedback link after output generation; the user must choose to send. `gtm/pilots.csv` can record consented assisted-pilot outcomes. There is no verified external activation count yet.

## Publication and distribution actions

1. Set the [GitHub repository homepage](https://github.com/AishwaryShrivastav/decker) to `https://decker.tfgstudio.com` and added `browser-extension`, `byok`, and `open-source` topics. Verified the resulting repository metadata through the GitHub API.
2. Submitted Decker to [OpenSourceChoice](https://opensourcechoice.com/#submit) for its free open-source directory on October 15. The submission included the MIT repository, canonical site, accurate browser-tab/BYOK description, and features. The site confirmed: “Submitted for review. Approved projects appear publicly with no listing fee or paid ranking.” This is **pending review**, not a live listing or a user acquisition claim.

## Blocker and next action

The public Store count cannot establish the external-user target or activation. With no automatic usage reporting, collect opt-in outcomes from real users before making an activation claim. Check whether OpenSourceChoice approves the submission, then recruit browser-meeting hosts with an existing OpenAI or Gemini key for consented first-meeting tests. Record only volunteered funnel outcomes in the pilot ledger; publish a permissioned artifact or testimonial only after a user explicitly agrees. Recheck the Store user count and directory listing after distribution, distinguishing total Store users from confirmed external users.
