# Chrome Web Store listing copy

Paste-ready. Title and short description ship inside the zip via `manifest.json`
(the store reads them from there); the full description, category, and language
are set in the developer dashboard.

## Title

```
Decker: Google Meet Notes, Decks & AI
```

37 characters. The store displays about 35 in search results, so "Decker:
Google Meet Notes" carries the ranking weight. Already set as `name` in
`apps/extension/public/manifest.json`.

## Short description (132 char max)

```
Record Google Meet without a bot. Get a slide deck, prototype, or meeting brief before the call ends. Your own OpenAI key.
```

122 characters. Already set as `description` in the manifest.

## Full description

```
Decker records the Google Meet tab from your own browser, so no bot joins the call. Prospects never ask who the extra participant is, and IT has nothing to block. The people you meet see only you.

While the meeting runs, Whisper transcribes the tab audio in 16-second chunks. Topics show up in the popup as they come up in conversation, and Decker researches the ones you select in the background. Near the end of the call, hit Generate and pick your output: a slide deck, a working prototype, a discussion site, or a structured meeting brief. Each lands in your Downloads folder as one self-contained HTML file. Share it in the chat before anyone hangs up.

Decker runs on one OpenAI API key that you paste into the popup once. The key stays in Chrome's local extension storage and is sent only to api.openai.com. There is no Decker server, no account, and no subscription. A 60-minute meeting costs a few cents in API usage.

You need Google Chrome and an OpenAI API key from platform.openai.com/api-keys. One key covers everything: Whisper for transcription, GPT-4o mini for topics and research, GPT-4o for generation.

Decker is open source under the MIT license. Read the code at github.com/AishwaryShrivastav/decker.

Built for meetings where you owe someone a deliverable: a spec review, a client kickoff, a pitch, an architecture call.
```

## Category

Productivity > Workflow & Planning

## Language

English

## Other dashboard fields

- Homepage URL: https://decker.techforgood.studio
- Privacy policy URL: https://decker.techforgood.studio/privacy
- Screenshots: upload the three 1280x800 PNGs from `store-assets/screenshots/`
  in numbered order (popup with key field, ready-to-record popup, sample
  meeting brief).
