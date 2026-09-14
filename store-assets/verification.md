# Privacy revision verification

Verified September 14, 2026 in the `privacy-truth` isolated worktree.

- Chrome build: passed both Vite builds (main extension and content entry).
- Extension TypeScript: `tsc --noEmit -p apps/extension/tsconfig.json` passed.
- Website production build: passed compilation, type validation, and generation
  of all six static pages. Landing and privacy prerendered HTML contain the
  direct OpenAI disclosure and API-billing copy; privacy date is fixed.
- Copy scan: removed browser-only, no-wait, IT-blocking, few-cents, and
  before-call-end claims from current landing, metadata, privacy, listing,
  manifest, popup, and README copy.
- `python3 scripts/verify-extension.py`: passed. All 13 ZIP files match the
  current build byte for byte. Manifest V3 version 0.1.0, listing summary,
  declared permissions, referenced scripts, and source icons match.
- Icons: 16x16, 48x48, 128x128 PNG, resized from the existing website logo.
  The 128 icon uses 96px artwork bounds and transparent padding. Icon and tile
  were visually inspected. The tile is 440x280, 8-bit RGB PNG without alpha.
- `git diff --check`: passed.

ZIP SHA-256:
`5b6350cfa50d25c480bd16fd534685c660e1e269fe07580ac58e76260ff67ea4`

There is no configured unit-test script in the repository. Validation used
builds, TypeScript, archive checks, and copy assertions. No secrets, real audio,
provider account data, paid API calls, or live recording sessions were used.
Existing store screenshots were neither changed nor verified as current UI.
No new product screenshots were created.

Local dependencies were reused through temporary symlinks. The system pnpm 11
wrapper attempted dependency reconciliation and failed; the cached pnpm 10.30.3
ran the builds successfully without installing packages. Build warnings remain
for Vite's deprecated CJS API, the deliberately empty content entry, Next.js
workspace-root inference, edge-route static generation, and missing metadataBase.
These checks do not verify live browser capture, deployed hosting settings, or
Chrome Web Store approval. See [owner actions](requirements.md).

Reproduce after installing workspace dependencies:

```sh
node scripts/generate-icons.js
bash scripts/package-extension.sh chrome
python3 scripts/verify-extension.py
pnpm --filter extension exec tsc --noEmit
NEXT_TELEMETRY_DISABLED=1 pnpm --filter web build
git diff --check
```

Commit status: staging was blocked by the session filesystem sandbox when Git
attempted to create `/Users/aishwary/Development/Decker/.git/worktrees/privacy-truth/index.lock`.
The shared Git metadata is outside the writable worktree. No commit was created;
all changes remain in this worktree. Nothing was pushed or deployed.
