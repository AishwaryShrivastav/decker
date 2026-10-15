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
3. Submitted the MIT repository to [Opensourcedex](https://opensourcedex.com/submit) on October 15. The form included the public Store URL, canonical privacy page, and the published 0.1.4 behavior: user-started capture of an eligible browser tab; optional microphone; OpenAI or Gemini BYOK; provider processing and possible provider charges; local key and recovery storage; and the actual Chrome permissions. The site confirmed, “Thanks — we review submissions and add qualifying projects within a few days.” **Pending human review; no public Decker listing URL yet.**
4. Signed into [Fossy](https://fossy.dev/submit) with `aish@techforgood.studio` and submitted `https://github.com/AishwaryShrivastav/decker` on October 15. Fossy confirmed “Repository Submitted!” and said the repository is in its moderation queue. **Pending moderation; no public Decker listing URL yet.** The form accepted only a GitHub repository URL, so Fossy will draw its description from public repository data if approved.

The [Chrome Web Store listing](https://chromewebstore.google.com/detail/decker-browser-meeting-no/khbafeikhdehdhpfcbdlfkpmmikbfihk) still showed **0.1.4, OpenAI/Gemini, and 3 users** when rechecked October 15. Uncommitted extension work adds Claude support but is unpublished; no new directory copy claims Claude support. “Free” refers to the extension and MIT source, while provider API use may consume quota or incur charges. The extension sends audio and text to the chosen provider; it is not an offline or zero-data-transfer recorder. Permissions in the published manifest are `tabCapture`, `storage`, `activeTab`, `offscreen`, and `downloads`, plus OpenAI and Gemini API host access. Microphone capture requires a separate permission.

## Channels checked but not submitted

- [Web Store Extensions](https://webstoreextensions.com/submit) is a relevant free browser-extension directory. TFG Google sign-in worked, but its mandatory form asks for 30-day uninstalls and the primary country of users. Those figures were unavailable from the public Store page; the Store developer dashboard required account re-verification. No values were guessed and no submission was made.
- [AlternativeTo](https://alternativeto.net/manage-item/) has live browser-meeting extension peers, but its signup says creating an account agrees to its terms. Google sign-in did not complete in the available browser session. No listing was submitted.
- [LibHunt](https://www.libhunt.com/repo/submit) accepts open-source GitHub URLs, but a Cloudflare security check blocked the submission form. No submission was made.
- [SaaSHub](https://www.saashub.com/services/submit) and [10015 Tools](https://10015.io/product-finder/submit) accept software or browser extensions, but registration/sign-in presented terms acceptance; no account or submission was completed there. Paid or slow-queue placements and directories requiring a site badge were not pursued.

## Blocker and next action

The public Store count cannot establish the external-user target or activation. With no automatic usage reporting, only volunteered outcomes can support an activation claim. Check OpenSourceChoice, Opensourcedex, and Fossy for approval before submitting to any of them again. Recheck the Store count after distribution and distinguish total Store users from confirmed external users. No individual outreach, paid placement, or new extension release was part of this pass.
