# Decker launch status

Updated September 22, 2026.

## Live surfaces

| Surface | State | URL |
| --- | --- | --- |
| Website | Live on Cloudflare Pages | https://decker.techforgood.studio |
| Demo | Live | https://decker.techforgood.studio/demo |
| Privacy policy | Live | https://decker.techforgood.studio/privacy |
| Support | Live | https://decker.techforgood.studio/support |
| Chrome Web Store | Public listing serves 0.1.3 | https://chromewebstore.google.com/detail/decker-google-meet-notes/khbafeikhdehdhpfcbdlfkpmmikbfihk |
| Chrome update | 0.1.4 submitted September 22; automatic publication enabled | Google review pending |

The submitted 0.1.4 package is unchanged at SHA-256
`80cb58898465afa423f715861b950b2713f991dd2cf5a4b5f3194c96991cdadf`.
Do not upload a replacement during review unless Google identifies a blocking
defect.

## Repository state

All Decker-owned pull requests are merged. `main` contains the capture
reliability fixes, truthful privacy disclosures, reduced Chrome permissions,
OpenAI and Gemini BYOK flow, activation guidance, browser-meeting website, Store
submission assets, and first-ten-user kit.

The old feature branches are retained only as history. They are not launch work
waiting to be merged.

## Release gate

Google approval is the only publication gate for 0.1.4. Automatic publication
will make the approved update public. Check the listing version after approval,
then update this file and the changelog with the release date.

## First ten users

Start with three assisted pilots among technical agency founders, consultants,
or product leads who use browser meetings and already have an OpenAI or Gemini API key. Each pilot
must produce one artifact from a real, consented meeting. Record the funnel in
`gtm/pilots.csv` and use `gtm/first-10-pilot-kit.md` for setup and interviews.

After three users complete a real meeting, publish one permissioned output with
the launch post and expand into open-source and Chrome extension communities.
Ask for a Store review only after the user creates a useful output. Keep paid
acquisition off until five pilots activate; setup and trust are the current
conversion risks.

## Verification record

The September 22 release pass ran 76 extension tests, extension TypeScript,
the Chrome production build, package verification, and the Cloudflare Pages
build. The package contains 18 verified files and supports OpenAI or Gemini.
After deployment, `/`, `/demo`, `/privacy`, and `/support` loaded on the custom
domain. The Store dashboard accepted the new listing, privacy declarations,
reviewer instructions, and package, then showed `Pending review`. Check the
public listing version again after Google approval.
