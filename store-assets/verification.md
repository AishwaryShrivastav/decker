# Decker 0.1.3 submission verification

Verified September 17, 2026 from the repository root.

## Results

- Extension tests: 23 passed, 0 failed.
- Extension TypeScript: `tsc --noEmit` passed.
- Chrome extension build: Vite completed successfully.
- Website production build: Next.js compiled, checked types, and generated all
  pages successfully.
- Package verifier: 14 ZIP files match the current `dist` build byte for byte.
- Manifest: MV3 version 0.1.3, 37-character title, 120-character description.
- Permissions: `tabCapture`, `storage`, `activeTab`, `offscreen`, `downloads`,
  and `https://api.openai.com/*` only.
- Package hygiene: no source maps, `.env` files, macOS metadata, hidden files,
  duplicate entries, path traversal, or detected API-key patterns.
- Store images: three 1280x800 screenshots, one 440x280 RGB tile, one 1400x560
  RGB marquee, and 16x16, 48x48, and 128x128 extension icons passed dimension
  and PNG-format checks.
- Copy and source formatting: `git diff --check` passed.

## Package identity

```
SHA-256  7e294f7c0101f585f07a9adcd13f41e8f44cd4cc0b261dc69494507d5f856451
Size     98,148 bytes
Version  0.1.3
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

The checks do not replace a consented Google Meet test with a working OpenAI key
or Chrome Web Store review. No key, real meeting content, paid API call, upload,
or Store submission was used for this audit.
