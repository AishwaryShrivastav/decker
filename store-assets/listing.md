# Chrome Web Store listing copy

Title and summary match `apps/extension/public/manifest.json`. Paste the full
description into the dashboard after completing [requirements.md](requirements.md).

## Title

```
Decker: Google Meet Notes, Decks & AI
```

## Short description (132 characters maximum)

```
Record Google Meet and create notes or decks. Audio and text go directly to OpenAI using your key. API charges apply.
```

## Full description

```
Decker records Google Meet from your browser without adding a bot participant. Use a meeting transcript to generate a slide deck, an interactive HTML prototype, a discussion site, or a structured meeting brief.

Click Start Recording in the extension popup. Decker captures the Meet tab audio and includes your microphone when permission and access are available. Audio is sent directly from your browser to OpenAI for transcription while you record. Transcript content is sent to OpenAI to extract topics. Selecting a topic sends it and transcript context to OpenAI for an AI summary; this is not a web search.

After stopping, wait for final processing, review or edit the transcript, choose topics and an output format, and generate. Your transcript, selections, instructions, and available topic context go to OpenAI for generation. Processing time varies with the recording, network, and API responses. Outputs are saved as HTML files in Downloads. Files can load external fonts, scripts, or other resources and may contain generated code. Review them before opening or sharing.

You need Chrome and your own OpenAI API key. The key is stored in local extension storage and sent directly to OpenAI to authenticate requests. OpenAI processes your audio and text and bills your account. API costs vary with usage. The extension is free and open source, with no Decker account or subscription required.

The extension's recording and generation requests do not pass through a developer-operated server. There is no automatic telemetry to the developer. Your key and recent debug logs remain in local extension storage; logs can include selected topic text and API errors. One recovery session is stored locally in IndexedDB and can include pending audio, transcript text, selected topics, instructions, edits, warnings, research results, and generated HTML. Pending audio is removed after transcription succeeds or exhausts three attempts. Starting over or starting another recording replaces the recovery session. Downloaded files remain until you delete them. Uninstalling removes local extension storage, but does not delete downloads or content already sent to OpenAI. If you contact the developer, they receive what you choose to share.

Tell participants about recording and OpenAI processing and obtain any required consent before starting. Browser and organization policies may restrict installation, recording, or OpenAI access.

Privacy policy: https://decker.techforgood.studio/privacy
Source code (MIT license): https://github.com/AishwaryShrivastav/decker
```

## Dashboard fields

- Suggested category: Productivity; choose the closest available workflow subcategory.
- Language: English.
- Homepage: https://decker.techforgood.studio
- Privacy policy: https://decker.techforgood.studio/privacy (owner must publish the updated policy before submission).
- Support: https://github.com/AishwaryShrivastav/decker/issues
- Small promotional image: `store-assets/promo-440x280.png`.
- Screenshots: existing files in `store-assets/screenshots/` are unverified legacy
  assets. Capture the actual updated extension UI before uploading. No screenshots
  were created or certified in this revision.
