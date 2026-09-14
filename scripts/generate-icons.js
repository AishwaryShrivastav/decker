#!/usr/bin/env node
// Resize the checked-in Decker logo; no generated UI or product screenshots.
// Uses Sharp already installed with the web app's Next.js dependency.
const fs = require("node:fs/promises");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const next = require.resolve("next/package.json", { paths: [path.join(root, "apps/web")] });
const sharp = require(require.resolve("sharp", { paths: [path.dirname(next)] }));

async function main() {
  const source = path.join(root, "apps/web/public/logo.png");
  // The source has a white background. Make near-white pixels transparent,
  // preserving the existing blue whale and slide artwork.
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] >= 245 && data[i + 1] >= 245 && data[i + 2] >= 245) data[i + 3] = 0;
  }
  const logo = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim().png().toBuffer();
  const iconDir = path.join(root, "apps/extension/public/icons");
  await fs.mkdir(iconDir, { recursive: true });
  for (const size of [16, 48, 128]) {
    const artworkSize = size === 128 ? 96 : size;
    const padding = (size - artworkSize) / 2;
    await sharp(logo)
      .resize(artworkSize, artworkSize, { fit: "contain", background: "#00000000" })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: "#00000000" })
      .png().toFile(path.join(iconDir, `icon${size}.png`));
  }

  // Brand artwork only. Exact store tile dimensions, opaque RGB PNG.
  const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280">
    <rect width="440" height="280" fill="#05111e"/>
    <circle cx="62" cy="140" r="152" fill="#0a2940"/>
    <text x="232" y="155" font-family="Helvetica,Arial,sans-serif" font-size="39" font-weight="700" fill="#e8f4fb">Decker</text>
  </svg>`);
  const mark = await sharp(logo).resize(180, 160, { fit: "contain", background: "#00000000" }).png().toBuffer();
  await sharp(tile).composite([{ input: mark, left: 32, top: 60 }])
    .flatten({ background: "#05111e" }).removeAlpha().png()
    .toFile(path.join(root, "store-assets/promo-440x280.png"));
  console.log("Generated 16, 48, 128 PNG icons and 440x280 RGB promotional tile from logo.png");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
