# Decker extension data-flow and permission audit

Reviewed September 14, 2026 against the Chrome extension source. No secrets,
real recordings, browser storage, or provider account data were read. This is a
source audit; it does not verify deployed hosting configuration or a live call.

## Recording and network flow

The popup (`apps/extension/src/popup/Popup.tsx`, `handleStart`) checks the active
Google Meet tab and obtains a tabCapture stream ID after the user clicks Start
Recording. `src/offscreen/index.ts` captures tab audio and attempts microphone
capture, mixing both when available. If mic capture fails there, it continues
with tab audio. No video is requested. Obtain any required participant consent
for recording and OpenAI processing before starting.

`src/background/index.ts` makes three fetch calls, all to the OpenAI API over
HTTPS, with the user's key as a Bearer token:

- `openaiTranscribe`: audio batches to `/v1/audio/transcriptions`, model
  `whisper-1`. Batches contain roughly 16 seconds of audio subject to a minimum
  size; later batches prepend the initial audio/header chunk. A final segment is
  sent after Stop. Audio leaves the device during recording.
- `llmComplete`: transcript content for topic extraction, and selected topics
  plus transcript content for AI topic context, to `/v1/chat/completions`, using
  `gpt-4o-mini`. Topic context is model output, not a web search.
- `llmStream`: transcript content (including user edits), selected topics,
  custom instructions, and available research context for HTML output, to
  `/v1/chat/completions`, using `gpt-4o`.

Selecting a topic can start transmission immediately. Deselecting it does not
cancel research already in progress. Final processing and generation add time;
there is no guaranteed completion time. OpenAI bills the user's account. Cost
varies with audio length, text volume, topic requests, and output.

The extension does not send these requests to the developer and includes no
analytics or automatic error-reporting integration. That does not mean the
extension handles no user data: OpenAI receives audio, text, and authentication
information. OpenAI retention depends on the endpoint, terms, and account
controls; Decker does not promise deletion or a particular retention period.
See [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data).

## Local storage and deletion

- `chrome.storage.local`: `openaiKey` and `deckerDebugLog`. The latter keeps up
  to 15 recent debug events, including timestamps, status messages, selected
  topic text, and API errors. Errors may include provider response details.
  Decker adds no encryption at rest and does not use `storage.sync`.
- Extension memory: audio buffers/queue, transcripts, extracted topics, research
  results, and latest generated HTML. The popup has additional editing state.
  Closing it does not clear service-worker state. State can be lost when the
  worker stops or the extension reloads; it is not a durable meeting archive.
- Downloads: generated HTML remains on disk until the user deletes it. Copy HTML
  writes the output to the clipboard; clipboard history is outside Decker's control.

Clear the key field and save to remove the saved key value. Uninstalling clears
local extension storage, including logs. Delete downloaded files separately.
Neither action deletes data already sent to OpenAI. Revoke keys in the OpenAI
account when needed. Resetting a session does not erase stored debug logs.

## Output, website, and support requests

The document template loads Google Fonts (`fonts.googleapis.com` and
`fonts.gstatic.com`). Other model-generated HTML can reference external fonts,
scripts, styles, or other resources, and can contain executable code. Open HTML
creates a blob URL in a new tab; downloads can be opened outside the extension.
Opening an output may make additional network requests. Host permissions are
not proof that output files cannot contact other hosts. Review outputs before
opening or sharing them.

The developer receives the email address and content of voluntary early-access
or support emails, and information posted in GitHub issues. Public issues are
public. Review logs before sharing and never include a key.

The website host receives ordinary HTTP request information when someone visits.
The checked-in pages request Google Fonts and include no analytics integration.
Hosting logs, provider-injected features, and retention need owner verification.
Separate Next.js routes exist in `apps/web/app/api/`: transcribe/extract-points
call OpenAI; research/generate-deck use Anthropic. If invoked on a deployment,
the host receives submitted audio/text and any `X-Api-Key` header, with some
metadata/errors logged. The Chrome extension does not call these routes. Do not
claim that the entire Decker project has no backend or never receives data.

## Declared Chrome permissions

| Declaration | Actual use and submission implication |
| --- | --- |
| `tabCapture` | User-initiated capture of the active Meet tab's audio. |
| `offscreen` | Runs MediaRecorder outside the popup so closing the popup does not stop capture. |
| `storage` | Saves the OpenAI key and recent debug log locally. |
| `downloads` | Saves generated HTML to Downloads. |
| `activeTab` | Temporary active-tab access after toolbar invocation; used alongside tabCapture. It is not required merely to open the microphone permission page. |
| `tabs` | Popup queries the active tab and reads its URL. This grants broader tab metadata access than the current use. Check whether `activeTab` plus Meet host access is sufficient and remove redundancy before submission. |
| `https://api.openai.com/*` | Authenticated HTTPS transcription and chat-completion requests. |
| `https://meet.google.com/*` | Declared Meet access and content-script match. Current `src/content/index.ts` is empty. Do not claim it reads meeting DOM or renders an in-page panel. Review whether this host access and the empty content script should be removed. |

Microphone consent uses the browser's media permission prompt, separate from the
manifest list. No permission guarantees that an organization will allow the
extension, microphone capture, or OpenAI traffic. The manifest was left unchanged
apart from its description in this copy-and-assets revision.

## Store declarations needing owner sign-off

Use [requirements.md](requirements.md) for the submission checklist. Declare
user data handling, including local handling and direct third-party processing;
do not select a blanket "no user data collected" answer just because the
developer receives no extension pipeline requests. The owner must resolve
permission minimization, credential/log storage security, generated code and
external-resource review, and the final dashboard categories/certifications.

Sources: [Chrome user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
and [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).
