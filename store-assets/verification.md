# Decker 0.1.4 submission verification

Verified September 22, 2026 from the repository root.

## Results

- Extension tests: 76 passed, 0 failed.
- Extension TypeScript: `tsc --noEmit` passed.
- Chrome extension build: Vite completed successfully.
- Website production build: Next.js compiled, checked types, and generated all
  pages successfully.
- Package verifier: 18 ZIP files match the current `dist` build byte for byte.
- Manifest: MV3 version 0.1.4 with browser-meeting and OpenAI/Gemini copy.
- Permissions: `tabCapture`, `storage`, `activeTab`, `offscreen`, `downloads`,
  `https://api.openai.com/*`, and `https://generativelanguage.googleapis.com/*` only.
- Package hygiene: no source maps, `.env` files, macOS metadata, hidden files,
  duplicate entries, path traversal, or detected API-key patterns.
- Store images: three 1280x800 screenshots, one 440x280 RGB tile, one 1400x560
  RGB marquee, and 16x16, 48x48, and 128x128 extension icons passed dimension
  and PNG-format checks.
- Copy and source formatting: `git diff --check` passed.

## Package identity

```
SHA-256  80cb58898465afa423f715861b950b2713f991dd2cf5a4b5f3194c96991cdadf
Size     107,868 bytes
Version  0.1.4
```

## Commands

```sh
node scripts/generate-icons.js
node scripts/generate-store-screenshots.js
bash scripts/package-extension.sh chrome
python3 scripts/verify-extension.py
pnpm --filter extension test
pnpm --filter extension exec tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 pnpm --filter web build
git diff --check
```

The checks do not replace a consented browser-meeting test with a working provider key
or Chrome Web Store review. No key, real meeting content, paid API call, upload,
or Store submission was used for this audit.
