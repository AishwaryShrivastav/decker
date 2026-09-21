# Decker extension data-flow and permission audit

Reviewed September 21, 2026 against the extension source prepared for version
0.1.4. The release ZIP has not been rebuilt. No secrets, real recordings,
browser storage, or provider account data were read.

## Provider setup and validation

The user chooses OpenAI or Gemini and enters an API key. Before saving it,
`src/background/index.ts` creates the selected provider adapter and calls its
live validation method. The key is saved only after every required probe
succeeds.

Both adapters send a one-character text request to the smaller generation model
and another to the full generation model. They also send a generated silent WAV
file through the transcription path. Validation can consume provider quota and
can appear in provider logs.

OpenAI validation sends the silent file to its transcription endpoint. Gemini
validation uses the same temporary upload and cleanup sequence as ordinary
Gemini transcription. All validation traffic goes directly from the extension
to the selected provider over HTTPS.

## Recording and processing

The popup checks the active tab after the user invokes Decker. Regular `http`
and `https` pages are eligible unless the browser blocks capture. Known browser
and extension Store pages are rejected. Native meeting apps cannot be captured.

A muted tab or a tab without recent audible activity remains eligible. The
popup shows a warning, then the offscreen recorder checks the captured track and
audio signal after recording starts. The user can include microphone audio after
granting browser permission. No video is requested.

Audio segments go directly to the selected provider for transcription. The
transcript, selected topics, custom instructions, and available topic context
go to the same provider for topic extraction, context generation, and artifact
generation. Selecting a topic can start a text request immediately. Deselecting
it does not cancel a request already in progress. Processing time, cost, and
accuracy are not guaranteed.

### OpenAI

OpenAI audio requests use `/v1/audio/transcriptions` with `whisper-1`. Text
requests use `/v1/chat/completions` with the current mini and full models
defined in `src/providers/openai.ts`. OpenAI receives the API key as a Bearer
token plus the audio or text required for the request.

### Gemini

Each Gemini audio segment is uploaded through the Files API. The returned URI
is sent to the Interactions API with `store: false`. Decker then waits for a
DELETE request for that uploaded file before the transcription call completes.
Cleanup runs in a `finally` block, including when transcription fails.

A failed Gemini deletion is retried up to three times. If all attempts fail,
Decker returns the transcript when available and adds a warning containing the
Gemini file name. The warning is saved in the local recovery session, shown on
the review page, and inserted into generated HTML. Decker cannot claim that a
file was deleted when Gemini returns a cleanup error.

Provider processing, logs, and retention depend on the provider terms and
account controls. Decker cannot delete content already sent to OpenAI. For
Gemini audio, it can report only the result of the deletion request.

## Local storage and deletion

- `chrome.storage.local` stores `providerSettings`, any migrated `openaiKey`,
  `deckerDebugLog`, and `deckerActivationV1`. The debug log keeps up to 15
  recent events and can include topic text, warnings, status messages, and API
  error details. The activation record keeps four timestamps: key saved,
  recording started, transcript ready, and output generated. Chrome Sync is not
  used, and Decker adds no separate encryption.
- Local IndexedDB stores one recovery session. It can contain pending audio,
  transcript text, selected topics, instructions, edits, warnings, topic
  context, and generated HTML. A pending segment is removed after transcription
  succeeds or after three failed transcription attempts. A new or reset session
  replaces the record. Audio that never reaches IndexedDB can still be lost.
- Downloads contain generated HTML until the user deletes it. Copy HTML writes
  the output to the clipboard.

Clear key removes the provider setting and legacy OpenAI key. Uninstalling
removes extension storage, including the recovery database and debug log.
Neither action removes downloaded files, clipboard history, or provider data.

## Developer, website, and output data

The extension has no automatic analytics or error-reporting integration. Its
provider pipeline sends no API key, audio, transcript, prompt, or artifact to
the Decker developer. Support email and GitHub issues contain only what the user
chooses to send. GitHub issues are public.

The website host receives ordinary request data. The pages request Google
Fonts and the checked-in site has no analytics integration. Hosting logs depend
on the operator. Separate Next.js API routes exist in the repository, but the
extension does not call them. A deployed route can receive content submitted
directly to it.

Generated HTML can request external fonts, scripts, styles, and other resources.
It can also contain executable code supplied by the selected model. Opening an
artifact can make network requests. Users should review generated HTML before
opening or sharing it.

## Declared Chrome permissions

| Declaration | Actual use and submission implication |
| --- | --- |
| `tabCapture` | Captures audio from the active eligible tab after the user clicks Start Recording. |
| `offscreen` | Runs MediaRecorder after the popup closes and attempts microphone capture after permission is granted. |
| `storage` | Saves provider settings, a small debug log, activation timestamps, and local recovery data. |
| `downloads` | Saves generated HTML after the user clicks Download HTML. |
| `activeTab` | Reads and captures the active tab after the user invokes Decker. It does not grant persistent access to meeting sites. |
| `https://api.openai.com/*` | Sends authenticated OpenAI validation, transcription, and text-generation requests. |
| `https://generativelanguage.googleapis.com/*` | Sends authenticated Gemini validation, temporary audio upload and deletion, transcription, and text-generation requests. |

Microphone access uses the browser media permission prompt. Browser or
organization policy can block installation, capture, microphones, or provider
traffic.

## Store declarations

Use [submission-fields.md](submission-fields.md) for the dashboard text and
[requirements.md](requirements.md) for the release checklist. Declare local
user activity, authentication information, meeting communications, and website
content. The selected provider is a disclosed processor.

Sources: [Chrome user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
and [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).
