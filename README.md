# Decker

**End every meeting with an aha moment.**

Record your Google Meet → AI transcribes it → download a polished Reveal.js presentation or meeting notes before anyone leaves the call.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)](https://chrome.google.com/webstore)

No server required. All AI calls go directly from the extension to the OpenAI API using your own key.

> **Get it in one click:** [$1 on the Chrome Web Store](https://chrome.google.com/webstore) — one-time payment, use forever. Or clone this repo and self-host for free.

---

## Features

- **One-click tab-audio recording** via Chrome's `tabCapture` API — no screen share, no extra installs
- **Live transcription** — Whisper processes audio in real time as you record
- **AI discussion-point extraction** — pick exactly which topics go in your deck
- **Custom instructions** — steer the AI with your own plain-text prompt
- **Bring your own OpenAI key** — stored locally in the browser, never sent to any third party
- **Two output formats** — Reveal.js presentation or scrollable HTML meeting notes
- **12 Reveal.js themes** + custom dark / green / blue / light backgrounds
- **Charts and diagrams** — Chart.js and Mermaid generated automatically where relevant

## Browser support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Supported |
| Brave | ✅ Supported |
| Arc | ✅ Supported |
| Edge | ✅ Supported |
| Firefox | 🚧 Scaffold exists, recording pipeline coming soon |

---

## Requirements

- Google Chrome 120+ (or Chromium-based equivalent)
- An **OpenAI API key** with access to `whisper-1` and `gpt-4o`
  - Get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Node.js 18+ and [pnpm](https://pnpm.io) (for local development/building only)

---

## Running locally

### 1. Clone and install dependencies

```bash
git clone https://github.com/AishwaryShrivastav/decker.git
cd decker
pnpm install
```

### 2. Build the extension

```bash
pnpm --filter extension build
```

This outputs the built extension to `apps/extension/dist/`.

### 3. Load the extension in Chrome

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** — toggle in the top-right corner
3. Click **Load unpacked**
4. Select the `apps/extension/dist/` folder

The Decker icon will appear in your Chrome toolbar. Pin it for easy access.

### 4. Add your OpenAI API key

> The key is stored in `chrome.storage.local` — it stays in your browser and is only ever sent directly to `api.openai.com`.

1. Click the **Decker icon** in the Chrome toolbar
2. Click the **⚙ gear icon** in the top-right of the popup
3. Paste your OpenAI API key (`sk-...`) into the **API Key** field
4. Click **Save**

The key persists across browser restarts. You only need to set it once.

---

## Using the extension

### Start recording

1. Join or open a Google Meet call (`meet.google.com/abc-def-ghi`)
2. Click the Decker icon — you should see **Meet ✓** and a mic status indicator
3. If mic permission hasn't been granted, click **Allow microphone** first
4. Click **▶ Start Recording**

Decker mixes your microphone (your voice) with the tab audio (other participants) and records both.

Live transcript chunks appear in the popup as Whisper processes them in the background — roughly every 16 seconds.

### Stop and review

Click **Stop & Transcribe**. Decker will:
1. Transcribe any remaining audio
2. Extract key discussion points using GPT-4o
3. Show a **Review & generate** screen

On the review screen you can:

| Option | What it does |
|--------|-------------|
| **Transcript textarea** | Edit the transcript to fix anything Whisper missed |
| **Points checkboxes** | Select/deselect which topics to include |
| **Output format** | `Presentation (Reveal.js)` or `HTML Notes` |
| **Slide theme** | 12 Reveal.js built-in themes + dark / green / blue / light |
| **Custom instructions** | Free-text prompt, e.g. *"Focus on action items"* or *"Make it suitable for executives"* |

### Generate

Click **Generate Deck** (or **Generate Notes**). The HTML file is saved to your Downloads folder automatically.

After generation:
- **Open HTML** — opens it in a new Chrome tab
- **Copy HTML** — copies the raw HTML to clipboard for pasting elsewhere

---

## Where the API key is stored and used

| Location | Purpose |
|----------|---------|
| `chrome.storage.local` | Persisted across browser sessions |
| Extension popup (⚙ settings) | Where you enter/update the key |
| Background service worker | Loaded on startup, used for all OpenAI calls |

The key is sent as a `Bearer` token directly to `https://api.openai.com/v1/*`. No intermediate server receives it.

---

## Project structure

```
Decker/
├── apps/
│   ├── extension/                   # Chrome MV3 extension
│   │   ├── public/
│   │   │   └── manifest.json        # Extension manifest
│   │   └── src/
│   │       ├── background/
│   │       │   └── index.ts         # Service worker — full recording + AI pipeline
│   │       ├── offscreen/
│   │       │   └── index.ts         # MediaRecorder (persists across SW suspension)
│   │       ├── popup/
│   │       │   └── Popup.tsx        # Full UI: record, review, generate
│   │       ├── content/
│   │       │   └── index.ts         # Content script (no-op — UI is in popup)
│   │       └── shared/
│   │           ├── prompts.ts       # ← Single source of truth for all LLM prompts
│   │           ├── revealTemplate.ts # Reveal.js HTML builder
│   │           ├── notesTemplate.ts  # Meeting notes HTML builder
│   │           └── types.ts          # Shared TypeScript types + enums
│   └── web/                         # Next.js landing page (not required to use extension)
├── scripts/
│   ├── package-extension.sh         # Zip dist/ for Chrome Web Store / Firefox Add-ons
│   └── generate-icons.js
└── README.md
```

---

## Build commands

```bash
# Install all workspace dependencies
pnpm install

# Build Chrome extension → apps/extension/dist/
pnpm --filter extension build

# Build Firefox extension → apps/extension/dist-firefox/
pnpm --filter extension build:firefox

# Run the landing page locally (optional)
pnpm --filter web dev

# Package extension for store submission
bash scripts/package-extension.sh chrome
bash scripts/package-extension.sh firefox
```

After any code change, rebuild and then click **↺ refresh** on the Decker card at `chrome://extensions`.

---

## Customising prompts

All LLM prompts live in a single file: [`apps/extension/src/shared/prompts.ts`](apps/extension/src/shared/prompts.ts)

| Export | Used for |
|--------|----------|
| `EXTRACT_POINTS_SYSTEM` | System prompt for extracting discussion points |
| `extractPointsUser(transcript)` | User message for point extraction |
| `DECK_SYSTEM` | System prompt for Reveal.js deck generation |
| `deckUser(transcript, points, customPrompt)` | User message for deck generation |
| `NOTES_SYSTEM` | System prompt for HTML notes generation |
| `notesUser(transcript, points, customPrompt)` | User message for notes generation |

Edit the file, then rebuild: `pnpm --filter extension build`.

---

## Troubleshooting

**"Meet not detected" / Start Recording is disabled**
Make sure you are on an active meeting URL (`meet.google.com/abc-def-ghi`), not the pre-join lobby.

**Mic not showing as granted**
Click **Allow microphone** in the popup. This opens a dedicated permission page. Grant mic access, close that tab, then try recording.

**Whisper returns empty or garbled text**
- Record for at least 20 seconds before stopping
- Check that your microphone is not muted system-wide
- Silent recordings produce empty transcripts

**GPT-4o ignores my custom instructions**
- Use imperative language: *"Include a timeline diagram"* not *"maybe add a diagram"*
- Keep instructions short and specific (under 200 characters works best)

**API errors in the popup**
Open the background logs: `chrome://extensions` → Decker → **Service Worker** → Inspect → Console

| Error code | Meaning |
|-----------|---------|
| `401` | API key is missing or invalid — check the ⚙ settings |
| `429` | Rate limit — wait a moment and try again |
| `400` on Whisper | Audio too short, silent, or corrupted |
| `400` on GPT-4o | Transcript too short (minimum 50 characters) |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports and PRs are welcome.

## Licence

[MIT](LICENSE) © 2025 Decker contributors
