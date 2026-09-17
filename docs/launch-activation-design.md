# Decker launch and activation design

## Decision

Decker will lead with one moment: a meeting ends with a deck the room can review while everyone is still present. The first launch pass will improve that path instead of expanding the product or adding automatic analytics.

The page and extension should answer four practical questions:

1. What will I get?
2. What do I need before the meeting?
3. Where does my meeting data go?
4. What should I do next?

## Discover

Three directions were considered.

- A broad AI meeting assistant would appeal to more people, but it would compete with established note takers and hide Decker's strongest behavior.
- A presentation generator would make the output familiar, but it would understate the value of capturing decisions and scope while the meeting is live.
- A closing room focuses the product on the final minutes of a client, product, or planning call. It gives the site a specific visual language and creates a clear activation goal.

The closing-room direction is the best fit for the shipped product and the first-ten-user goal.

## Define

**Audience:** technical founders, product consultants, and small agency leads who run consequential Google Meet calls and already understand API keys.

**Page job:** earn an install and prepare the visitor to complete one real meeting.

**Product activation:** a user saves an OpenAI key, starts a recording, reaches transcript review, and generates an output.

**Visual identity:** a quiet control room for the last five minutes of a meeting. The signature element is a horizontal decision rail that turns live statements into an inspectable deck. The palette stays dark navy with cyan reserved for actions and warm paper for the generated artifact. The page uses Space Grotesk for display text, DM Sans for reading, and IBM Plex Mono for meeting state and evidence.

## Deliver

The launch pass will:

- replace the generic hero split with a closing-room scene built from real product states;
- put the first-meeting checklist and sample output before feature detail;
- remove stale Chrome Web Store review language;
- explain API-key cost and data handling beside the install action;
- surface first-run requirements inside the extension popup;
- record four activation milestones in local extension storage, using timestamps only;
- add a structured manual feedback route after output generation;
- publish a ten-user pilot kit with target profiles, outreach copy, interview questions, and a tracking ledger.

No meeting content, API keys, URLs, names, or automatic telemetry will be sent to Decker. Local milestone timestamps help support conversations and can be copied by the user when they choose to contact support.

## Verification

- Extension unit tests cover local milestone storage and redaction boundaries.
- Existing extension tests and production builds must remain green.
- The website must build for Cloudflare Pages.
- Desktop and mobile checks cover the install CTA, demo, support route, privacy route, first-meeting steps, focus states, and reduced motion.
- Live verification must confirm the deployed page and Chrome Web Store link.
