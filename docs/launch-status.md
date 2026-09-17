# Decker launch status

Updated September 17, 2026.

## Live surfaces

| Surface | State | URL |
| --- | --- | --- |
| Website | Live on Cloudflare Pages | https://decker.techforgood.studio |
| Demo | Live | https://decker.techforgood.studio/demo |
| Privacy policy | Live | https://decker.techforgood.studio/privacy |
| Support | Live | https://decker.techforgood.studio/support |
| Chrome Web Store | Public listing serves 0.1.2 | https://chromewebstore.google.com/detail/decker-google-meet-notes/khbafeikhdehdhpfcbdlfkpmmikbfihk |
| Chrome update | 0.1.3 submitted; automatic publication enabled | Google review pending |

The submitted 0.1.3 package is unchanged at SHA-256
`7e294f7c0101f585f07a9adcd13f41e8f44cd4cc0b261dc69494507d5f856451`.
Do not upload a replacement during review unless Google identifies a blocking
defect.

## Repository state

All Decker-owned pull requests are merged. `main` contains the capture
reliability fixes, truthful privacy disclosures, reduced Chrome permissions,
single-key OpenAI flow, activation guidance, closing-room website, Store
submission assets, and first-ten-user kit.

The old feature branches are retained only as history. They are not launch work
waiting to be merged.

## Release gate

Google approval is the only publication gate for 0.1.3. Automatic publication
will make the approved update public. Check the listing version after approval,
then update this file and the changelog with the release date.

## First ten users

Start with three assisted pilots among technical agency founders, consultants,
or product leads who already use Google Meet and OpenAI API keys. Each pilot
must produce one artifact from a real, consented meeting. Record the funnel in
`gtm/pilots.csv` and use `gtm/first-10-pilot-kit.md` for setup and interviews.

After three users complete a real meeting, publish one permissioned output with
the launch post and expand into open-source and Chrome extension communities.
Ask for a Store review only after the user creates a useful output. Keep paid
acquisition off until five pilots activate; setup and trust are the current
conversion risks.

## Verification record

The September 17 landing pass ran 23 extension tests, extension TypeScript,
the Chrome production build, package verification, and the Cloudflare Pages
build. The public routes and Store link must be checked again after every web
deployment or Store approval.
