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

  // Optional 1400x560 marquee. It keeps the same mark and palette as the
  // extension icon and small promotional tile, with enough contrast to survive
  // the Store's responsive crops.
  const marquee = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#05111e"/>
        <stop offset="1" stop-color="#0a2940"/>
      </linearGradient>
      <linearGradient id="deck" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1aade4"/>
        <stop offset="1" stop-color="#7c86ff"/>
      </linearGradient>
    </defs>
    <rect width="1400" height="560" fill="url(#bg)"/>
    <circle cx="1240" cy="20" r="360" fill="#0d3856" opacity=".72"/>
    <circle cx="170" cy="545" r="310" fill="#071c2c"/>
    <g transform="translate(760 105)">
      <rect x="0" y="84" width="430" height="250" rx="22" fill="#071828" stroke="#245a77" stroke-width="2"/>
      <rect x="36" y="121" width="188" height="14" rx="7" fill="#e8f4fb" opacity=".92"/>
      <rect x="36" y="153" width="322" height="9" rx="4.5" fill="#5a8099"/>
      <rect x="36" y="183" width="358" height="76" rx="12" fill="#0b2638" stroke="#1aade4" stroke-width="2"/>
      <rect x="58" y="207" width="201" height="11" rx="5.5" fill="url(#deck)"/>
      <rect x="58" y="230" width="276" height="8" rx="4" fill="#5a8099"/>
      <rect x="36" y="281" width="111" height="18" rx="9" fill="#123b54"/>
      <rect x="160" y="281" width="111" height="18" rx="9" fill="#123b54"/>
    </g>
    <text x="280" y="263" font-family="Helvetica,Arial,sans-serif" font-size="76" font-weight="700" fill="#e8f4fb">Decker</text>
    <text x="282" y="315" font-family="Helvetica,Arial,sans-serif" font-size="25" fill="#83a8bd">The meeting ends. The follow-up is ready.</text>
  </svg>`);
  const marqueeMark = await sharp(logo).resize(190, 170, { fit: "contain", background: "#00000000" }).png().toBuffer();
  await sharp(marquee).composite([{ input: marqueeMark, left: 55, top: 190 }])
    .flatten({ background: "#05111e" }).removeAlpha().png()
    .toFile(path.join(root, "store-assets/marquee-1400x560.png"));
  console.log("Generated extension icons, 440x280 tile, and 1400x560 marquee from logo.png");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
