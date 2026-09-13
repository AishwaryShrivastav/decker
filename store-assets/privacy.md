# Decker privacy disclosure

Every claim below is verifiable in the source at
github.com/AishwaryShrivastav/decker. File references point at the code that
implements the behavior.

## What the extension accesses

- **Tab audio of the active Google Meet tab.** Capture starts only when you
  click Start Recording in the popup, which requests a `tabCapture` stream ID
  for the current tab (`apps/extension/src/popup/Popup.tsx`,
  `chrome.tabCapture.getMediaStreamId`). An offscreen document records it with
  MediaRecorder (`apps/extension/src/offscreen/index.ts`).
- **Microphone audio, if you grant it.** The offscreen recorder mixes your mic
  with the tab audio so your own voice is transcribed too. If mic permission is
  denied, recording continues with tab audio only
  (`apps/extension/src/offscreen/index.ts`, lines 37-41).
- **Your OpenAI API key.** Stored in `chrome.storage.local` on your device
  (`apps/extension/src/background/index.ts`, `SET_API_SETTINGS` handler). It is
  attached as a `Bearer` token to requests sent to api.openai.com and nowhere
  else.
- **A local debug log.** The last 15 pipeline events (timestamps and status
  messages, no audio or transcript content beyond lengths) are kept in
  `chrome.storage.local` for troubleshooting (`debugLog` in
  `apps/extension/src/background/index.ts`).

## What leaves your machine

Two destinations, both api.openai.com, both authenticated with your own key:

1. **Audio** goes to `https://api.openai.com/v1/audio/transcriptions` (Whisper)
   in roughly 16-second chunks while you record, plus one final segment when
   you stop (`openaiTranscribe` in `apps/extension/src/background/index.ts`).
2. **Text** (the transcript, extracted topics, and generation prompts) goes to
   `https://api.openai.com/v1/chat/completions` (`llmComplete` and `llmStream`
   in the same file).

The manifest's host permissions are limited to `https://meet.google.com/*` and
`https://api.openai.com/*`, so the extension cannot call any other API host.
These transmissions are governed by OpenAI's privacy policy and your OpenAI
account settings.

One adjacent note: the generated HTML files reference fonts.googleapis.com in a
`<link>` tag, so opening a downloaded artifact fetches fonts from Google. That
request comes from the file you open, not from the extension.

## What is never collected

- **No server.** Decker has no backend. There is no endpoint operated by the
  developer anywhere in the extension code; the only `fetch` calls in
  `apps/extension/src/background/index.ts` target api.openai.com.
- **No analytics or telemetry.** No tracking library, no error reporting
  service, no usage pings. The built bundle contains no network destination
  other than the OpenAI API.
- **No account.** Decker never asks who you are.
- **Your key, audio, and transcripts are never sent to the developer.** They
  exist only in your browser and in your own OpenAI account's request history.
