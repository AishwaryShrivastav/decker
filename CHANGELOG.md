# Changelog

All notable changes to this project will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2025-03-20

Initial public release.

### Added

**Extension (Chrome MV3)**
- One-click tab-audio recording via Chrome `tabCapture` API — no screen-share dialog
- Live transcription: Whisper processes audio in ~16-second chunks as you record
- Two-phase AI pipeline: transcribe → extract discussion points → generate
- AI discussion-point extraction via GPT-4o (5–12 key points per meeting)
- Review screen: edit transcript, select/deselect points, add custom instructions
- Two output formats: Reveal.js slide deck and scrollable HTML meeting notes
- 12 built-in Reveal.js themes + dark / green / blue / light custom backgrounds
- Chart.js charts and Mermaid diagrams auto-generated where relevant
- Bring your own API key — supports OpenAI (`sk-...`) and Anthropic Claude (`sk-ant-...`)
- API key stored in `chrome.storage.local`, never sent to any Decker server
- Direct API calls: browser → OpenAI, no relay server required
- Debug log panel in extension settings (last 15 events, with timestamps)
- Microphone permission flow for first-time users

**Web (Next.js 15)**
- Landing page at [decker.techforgood.studio](https://decker.techforgood.studio)
- BYOK-first messaging and privacy-first story
- Aha moment / use-case clarity (pitch calls, strategy sessions, client kickoffs)
- Pricing: free open source self-host + $1 one-time Chrome plugin
- `/api/transcribe` — Whisper proxy (optional, for self-hosted use)
- `/api/extract-points` — GPT-4o point extraction proxy (optional)
- `/api/generate-deck` — Deck/notes generation proxy (optional)

**Repository**
- Firefox MV2 scaffold (`public-firefox/`, `vite.firefox.config.ts`) — recording pipeline TBD
- `scripts/package-extension.sh` — zip for Chrome Web Store / Firefox Add-ons submission
- `scripts/generate-icons.js` — icon generation utility
- MIT License, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
- GitHub issue and PR templates

### Known Limitations

- Firefox recording pipeline not yet implemented (scaffold exists)
- Safari not supported (no `tabCapture` API)
- Audio chunks > 25MB not supported (Whisper API limit)
- Requires an active Google Meet session URL (`meet.google.com/abc-def-ghi`)
- Silent recordings produce empty transcripts
