# Chrome Web Store listing copy for Decker 0.1.4

Use these values for the next Store update. The title and short description
match `apps/extension/public/manifest.json`.

## Title

```text
Decker: Browser Meeting Notes & AI
```

## Short description

```text
Record browser meetings, review transcripts, and create HTML artifacts with your OpenAI or Gemini key.
```

## Detailed description

```text
Record a browser meeting without adding a bot to the call.

Decker captures audio from an eligible meeting tab in your Chromium browser. Connect OpenAI or Gemini with your own API key, record the tab with an optional microphone, correct the transcript, and create the artifact you need.

Use this four-step flow:

1. Connect OpenAI or Gemini.
2. Record the active browser tab.
3. Review and edit the transcript.
4. Generate the artifact, download the HTML file, and open it.

Choose from four output formats:

* Meeting document with summaries and action items
* HTML presentation
* Discussion page
* Static HTML prototype

Decker checks the provider key before saving it. Validation makes small live text-generation requests and sends a generated silent audio sample through transcription. Provider quota or charges may apply.

Meeting audio and text go directly from the extension to the selected provider. The developer does not receive your API key or automatic meeting-content telemetry. Your provider setting, recent debug log, timestamp-only setup milestones, and one recovery session stay in local browser storage.

Gemini transcription uploads each audio segment as a temporary Gemini file. Decker requests transcription with storage disabled, waits for file deletion, and retries a failed deletion up to three times. If deletion still fails, Decker keeps the transcript and shows a warning with the file name.

Muted tabs and tabs with no recent audio remain eligible. Decker warns you, then checks the captured track and audio signal after recording starts. Native meeting apps are outside the browser and cannot be captured.

Generated HTML can contain external resources or executable code supplied by the model. Review each file before opening or sharing it. Tell meeting participants which provider will process the recording and obtain any required consent.

Decker is free and open source. There is no Decker account or subscription. OpenAI or Google bills or meters API use through your provider account.

Privacy policy: https://decker.techforgood.studio/privacy
Support: https://decker.techforgood.studio/support
Source code: https://github.com/AishwaryShrivastav/decker
```

## Product details

- Category: Workflow & Planning
- Language: English
- Homepage URL: https://decker.techforgood.studio
- Support URL: https://decker.techforgood.studio/support
- Official URL: https://decker.techforgood.studio, when available in the dashboard
- Mature content: Off
- Pricing: Free of charge
- Visibility: Public
- Regions: All regions

## Search intent

The title and opening copy cover browser meeting recording, meeting notes,
transcripts, HTML artifacts, Chrome extensions, OpenAI, Gemini, and BYOK. Do
not append a keyword list to the Store description.
