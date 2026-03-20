# Contributing to Decker

Thanks for taking the time to contribute! Decker is a community project and all contributions are welcome — bug fixes, features, docs, or just feedback.

## Before you start

- Check [open issues](https://github.com/AishwaryShrivastav/decker/issues) to see if your idea is already being worked on.
- For significant changes, open an issue first to discuss the approach.

## Setting up locally

```bash
git clone https://github.com/AishwaryShrivastav/decker.git
cd decker
pnpm install
```

**Build the extension:**
```bash
pnpm --filter extension build
# Output → apps/extension/dist/
```

**Run the web app (optional — extension works standalone):**
```bash
pnpm --filter web dev
# → http://localhost:3000
```

**Load the extension in Chrome:**
1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click **Load unpacked** → select `apps/extension/dist/`

After any code change: rebuild, then click **↺ refresh** on the Decker card in `chrome://extensions`.

## Project structure

```
apps/extension/src/
├── background/index.ts     # Service worker — orchestrates recording & AI pipeline
├── offscreen/index.ts      # MediaRecorder (persists across SW suspension)
├── popup/Popup.tsx         # Full UI: record, review, generate
├── content/index.ts        # Content script
└── shared/
    ├── prompts.ts          # ← All LLM prompts live here (single source of truth)
    ├── types.ts            # Shared TypeScript types
    ├── revealTemplate.ts   # Reveal.js HTML builder
    └── notesTemplate.ts    # Meeting notes HTML builder

apps/web/app/
├── page.tsx                # Landing page
└── api/                    # Next.js API routes (transcribe, extract-points, generate-deck)
```

## Customising prompts

All LLM prompts are in [`apps/extension/src/shared/prompts.ts`](apps/extension/src/shared/prompts.ts). Edit this file and rebuild — no other changes required.

## Branch & PR conventions

- Branch from `main`: `git checkout -b feat/your-feature`
- Keep PRs focused — one thing per PR
- Write a clear PR description explaining what and why
- Run TypeScript check before submitting: `pnpm --filter extension build`

## Code style

- TypeScript everywhere — no `any` unless absolutely necessary
- React functional components with hooks
- Keep components small and focused
- No external UI libraries — plain React + CSS

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:
- Browser and version
- Extension version (from `chrome://extensions`)
- Steps to reproduce
- Background service worker console logs if relevant

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
