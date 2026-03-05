# Decker

> Record any Google Meet call → AI transcribes it → download a Reveal.js presentation in one click.

![Decker panel screenshot](store-assets/screenshot-panel.png)

## Features

- **One-click tab-audio recording** via Chrome's `tabCapture` API — no screen share, no installs
- **Whisper transcription** — accurate even with multiple speakers
- **AI discussion-point extraction** — pick exactly which topics go in your deck
- **Custom instructions** — steer the AI with your own prompt
- **Bring your own API key** — OpenAI (`sk-…`) or Anthropic (`sk-ant-…`); your audio never touches our servers
- **Reveal.js output** — self-contained HTML that runs offline, anywhere
- **Open source & free** — MIT licence, self-hostable API

## Browser support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Supported |
| Brave | ✅ Supported |
| Arc | ✅ Supported |
| Edge | ✅ Supported |
| Firefox / Zen | 🚧 Coming soon |

## Quick start

### Install from store

**Chrome / Brave / Arc / Edge →** [Chrome Web Store](#) *(coming soon)*

### Load from source (developer mode)

```bash
# 1. Clone
git clone https://github.com/your-username/decker.git
cd decker

# 2. Install deps
pnpm install

# 3. Build extension
pnpm build:extension   # outputs to apps/extension/dist/

# 4. Load in Chrome
#    chrome://extensions → Enable "Developer mode" → "Load unpacked" → select dist/
```

### Run the API locally

```bash
# Copy env template and add your OpenAI key
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local: OPENAI_API_KEY=sk-...

pnpm dev:web   # starts Next.js on http://localhost:3000
```

The extension's `API_BASE_URL` in `apps/extension/src/shared/constants.ts` should point to your running Next.js instance (default `http://localhost:3000`).

## Monorepo structure

```
Decker/
├── apps/
│   ├── extension/          # Chrome MV3 extension (Vite + React + TypeScript)
│   │   ├── src/background/ # Service worker — recording state + API pipeline
│   │   ├── src/offscreen/  # MediaRecorder in offscreen document
│   │   ├── src/content/    # Injected Decker panel (Shadow DOM)
│   │   ├── src/popup/      # Extension popup
│   │   └── src/shared/     # Shared types + constants
│   └── web/                # Next.js 15 API server
│       └── app/api/
│           ├── transcribe/      # POST audio → Whisper → transcript
│           ├── extract-points/  # POST transcript → discussion points
│           └── generate-deck/   # POST transcript + points → Reveal.js HTML
├── scripts/
│   └── package-extension.sh    # Zips dist/ for marketplace submission
└── package.json                # pnpm workspace root
```

## Build commands

| Command | Description |
|---------|-------------|
| `pnpm build:extension` | Build Chrome MV3 extension → `dist/` |
| `pnpm build:firefox` | Build Firefox MV2 extension → `dist-firefox/` |
| `pnpm dev:web` | Start Next.js dev server |
| `pnpm build:web` | Production Next.js build |
| `bash scripts/package-extension.sh` | Zip `dist/` for Chrome Web Store submission |

## Environment variables

Create `apps/web/.env.local`:

```env
# Fallback OpenAI key used when user has a Claude key (Whisper still needs OpenAI)
OPENAI_API_KEY=sk-...
```

Users can also supply their own key in the extension settings — it is forwarded via `X-Api-Key` and takes precedence over the server env var.

## Contributing

1. Fork → branch → PR
2. Run `pnpm build:extension` to check for TypeScript errors before submitting
3. Keep PRs focused — one feature / fix per PR

## Deployment

The Next.js API can be deployed to Vercel (or any Node.js host) with zero configuration. Set `OPENAI_API_KEY` as an environment variable in your deployment dashboard.

## Licence

[MIT](LICENSE) © 2025 Decker contributors
