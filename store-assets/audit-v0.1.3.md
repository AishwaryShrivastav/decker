# Decker Store audit: live 0.1.2 versus prepared 0.1.3

Audited September 17, 2026 against the public Chrome Web Store listing, the
0.1.3 package, extension source, and https://decker.techforgood.studio.

## What is live now

The Store serves version 0.1.2, updated September 16, 2026. The listing has three
screenshots, no ratings, and the Developer Tools category. Its privacy card
discloses personally identifiable information, authentication information,
personal communications, and website content. The listing links its support
section to the site homepage.

The public description is accurate about direct OpenAI processing, local key and
recovery storage, the absence of developer telemetry, and generated HTML risks.
It reads mainly as a data-flow explanation, so the product result is difficult to
scan before the install decision.

## Changes for 0.1.3

| Area | Live 0.1.2 | Prepared 0.1.3 | Dashboard action |
| --- | --- | --- | --- |
| Product | Capture, transcript review, four HTML outputs | Same core workflow plus first-meeting checklist, local milestone timestamps, and voluntary feedback draft | Upload new ZIP |
| Version | 0.1.2 | 0.1.3 | Confirm after upload |
| Short description | Leads with recording and data flow | Leads with notes, decks, prototypes, BYOK, free/open source | Replace |
| Detailed description | Accurate but compliance-heavy | Opens with the meeting result, then states exact data handling | Replace |
| Category | Developer Tools | Workflow & Planning | Change |
| Support URL | Homepage | Dedicated `/support` page | Change |
| Privacy categories | Four categories | Adds User activity for four local milestone timestamps | Add category |
| Permissions | Same narrow MV3 set | `tabCapture`, `storage`, `activeTab`, `offscreen`, `downloads`, and OpenAI host access | Paste refreshed justifications |
| Privacy page | Previously named stale `tabs` and Meet host access | Corrected to match the 0.1.3 manifest | Verify deployed page |
| Promo assets | 440x280 tile present | Adds optional 1400x560 marquee in the same brand system | Upload both |
| Reviewer path | General BYOK instructions | Exact eight-step test path and expected traffic | Replace |

## Conversion decisions

The Store title remains `Decker: Google Meet Notes, Decks & AI` because it names
the product, meeting surface, and main outputs without repeating keywords. The
new first sentence describes the end result. The second paragraph explains the
in-browser capture model without using the more crowded "AI meeting assistant"
label.

Workflow & Planning matches a tool that turns meetings into follow-up artifacts.
Developer Tools describes browser debugging and development utilities, which is
not Decker's main use.

Three screenshots are sufficient for this update because they cover setup, the
record-ready state, and the generated artifact. Chrome recommends up to five,
but two extra decorative frames would add upload work without explaining another
product capability. A product video remains optional.

## Remaining operational checks

The extension needs one consented end-to-end Meet run with a working OpenAI key.
That test is separate from ZIP integrity and cannot be proven by source review.
The Store reviewer will also need an OpenAI key to exercise transcription and
generation. No key belongs in the package or reviewer notes.

The generated HTML declaration is explicit. The package contains all extension
runtime JavaScript and loads no remote runtime script. OpenAI returns the output
the user asked Decker to create; Decker saves it and can open it in another tab.
The listing, in-product UI, privacy policy, and reviewer notes all disclose that
the output can include external resources or code.
