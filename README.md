# Decker

**Record a browser meeting without a bot, review the transcript, and create an HTML artifact.**

Decker is a Chrome extension for meetings that run in a Chromium browser tab. Connect your own OpenAI or Gemini API key, record the active tab with an optional microphone, correct the transcript, and create a meeting document, presentation, discussion page, or prototype.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Install-blue?logo=googlechrome)](https://chromewebstore.google.com/detail/decker-google-meet-notes/khbafeikhdehdhpfcbdlfkpmmikbfihk)

**Website:** [decker.techforgood.studio](https://decker.techforgood.studio)

**Launch status:** [website, Store review, and first-user plan](docs/launch-status.md)

The extension sends requests directly to the provider you select. Decker has no extension backend and receives no automatic meeting-content telemetry. The separate web API routes in this repository are not used by the extension.

> [Install Decker from the Chrome Web Store](https://chromewebstore.google.com/detail/decker-google-meet-notes/khbafeikhdehdhpfcbdlfkpmmikbfihk), or build it from source.

## How it works

1. Connect OpenAI or Gemini with your own API key.
2. Record an eligible meeting tab in a Chromium browser.
3. Review and correct the transcript in the Decker review page.
4. Generate an artifact, download the HTML file, and open it in your browser.

Decker checks the provider key before saving it. The check makes small live requests for both text models and sends a generated silent audio sample through transcription. Provider quota or charges may apply.

## Features

- User-initiated tab audio capture through Chrome's `tabCapture` API
- Optional microphone audio mixed with the meeting tab
- OpenAI or Gemini bring-your-own-key processing
- Muted-tab and silence warnings, followed by captured-track and signal checks
- Editable transcript, topic selection, and custom generation instructions
- Four HTML outputs: meeting document, presentation, discussion page, and prototype
- One local recovery session for interrupted work

Decker can record eligible `http` and `https` tabs when the browser allows capture. A muted tab or a tab with no recent audio can still start, but Decker warns you and checks the captured signal. Native Zoom, Teams, Webex, and other meeting apps are outside the browser and cannot be recorded by the extension.

## Requirements

- Chrome 120+ or a compatible Chromium browser that can install Chrome extensions
- An OpenAI or Gemini API key with access to the required transcription and text models
- Node.js 18+ and [pnpm](https://pnpm.io) for local development

Get a key from [OpenAI](https://platform.openai.com/api-keys) or [Google AI Studio](https://aistudio.google.com/apikey). Each provider bills or meters API use through its own account.

## Run locally

```bash
git clone https://github.com/AishwaryShrivastav/decker.git
cd decker
pnpm install
pnpm --filter extension build
```

Open `chrome://extensions`, enable Developer mode, choose Load unpacked, and select `apps/extension/dist/`. Pin Decker to the toolbar.

## Connect a provider

1. Open Decker from the browser toolbar.
2. Choose OpenAI or Gemini.
3. Paste the provider key and choose Save key.
4. Wait for Decker to finish the live capability checks.

The selected provider and key are stored in `chrome.storage.local` on the device. Clear key removes the provider setting and any migrated OpenAI key.

## Record and review

Open the meeting in a regular browser tab, then open Decker. The readiness view reports whether the tab is eligible and whether microphone permission is available. If the tab is muted or no audio is playing, Decker shows a warning and still lets the capture checks decide whether recording can continue.

Choose whether to include the microphone, obtain any required participant consent, and start recording. When you stop, Decker finishes pending transcription and opens the review page. There you can edit the transcript, choose topics, add instructions, select an output, and generate the artifact.

Generated HTML is kept with the local recovery session until it is replaced. Copy HTML writes it to the clipboard. Download HTML saves a file to Downloads; open that file in a browser to inspect or use it.

## Data and privacy

Audio, transcript text, selected topics, instructions, and generation context go directly from the extension to OpenAI or Gemini, whichever you connected. The provider key is used for authentication and never sent to the Decker developer.

OpenAI receives audio through its transcription API and text through its chat-completions API. Gemini transcription first uploads each audio segment as a temporary Gemini file. Decker asks Gemini to process the file with storage disabled, waits for deletion, and retries a failed deletion up to three times. If cleanup still fails, the transcript remains available and Decker adds a warning with the file name to the local recovery session and review page.

Local extension storage contains the provider setting, up to 15 debug events, and four timestamp-only activation milestones. One IndexedDB recovery record can contain pending audio, transcript text, topics, instructions, edits, warnings, topic context, and generated HTML. Pending audio leaves the queue after transcription succeeds or after three failed transcription attempts. Starting or resetting a session replaces the recovery record.

Downloaded files remain until you delete them. Uninstalling clears extension storage, though it does not remove downloads, clipboard history, or data already processed by a provider. Read the [privacy policy](https://decker.techforgood.studio/privacy) and [source audit](store-assets/privacy.md) before recording sensitive material.

## Project structure

```text
Decker/
|-- apps/
|   |-- extension/
|   |   |-- public/manifest.json
|   |   `-- src/
|   |       |-- background/
|   |       |-- offscreen/
|   |       |-- popup/
|   |       |-- providers/
|   |       |-- review/
|   |       `-- shared/
|   `-- web/
|-- scripts/
`-- store-assets/
```

## Development commands

```bash
pnpm --filter extension test
pnpm --filter extension typecheck
pnpm --filter extension build
pnpm --filter web build
```

After an extension change, rebuild it and refresh the Decker card at `chrome://extensions`.

## Prompts

Shared model prompts live in [`apps/extension/src/shared/prompts.ts`](apps/extension/src/shared/prompts.ts). Both providers use these prompts through their provider adapters.

## Troubleshooting

**The tab is not eligible**

Use a regular `http` or `https` meeting tab. Browser settings pages, extension pages, Store pages, inactive tabs, and native meeting apps cannot be captured.

**The tab is muted or silent**

Start playback in the meeting tab and check the tab mute control. Decker can begin from a warning state, then stops with an actionable error if the captured track or signal check fails.

**The microphone is blocked**

Allow microphone access from the Decker permission page, or turn off Include my microphone to record tab audio only.

**The provider key fails validation**

Confirm the key, billing or quota, and access to the required text and transcription models. Validation checks all required capabilities before Decker saves the key.

**A Gemini cleanup warning appears**

Decker attempted the temporary file deletion three times and could not confirm success. Keep the file name from the warning, review your Gemini account controls, and avoid sharing the warning if it contains sensitive account details.

**The transcript has a missing segment**

Decker retries a failed transcription three times. After the third failure, it inserts a missing-segment marker and keeps the rest of the transcript available for review.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report security issues through [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE) © 2025 Decker contributors
