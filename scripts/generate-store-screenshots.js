#!/usr/bin/env node
// Rebuild Store screenshots from the current extension UI and checked-in logo.
// The images use fictional state only: masked key, browser meeting, no private content.
const path = require("node:path");
const fs = require("node:fs/promises");
const root = path.resolve(__dirname, "..");
const next = require.resolve("next/package.json", { paths: [path.join(root, "apps/web")] });
const sharp = require(require.resolve("sharp", { paths: [path.dirname(next)] }));

const out = path.join(root, "store-assets/screenshots");
const esc = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

async function logoData() {
  const data = await fs.readFile(path.join(root, "apps/extension/public/icons/icon128.png"));
  return `data:image/png;base64,${data.toString("base64")}`;
}

function frame(content, logo) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800">
    <rect width="1280" height="800" fill="#05111e"/>
    <circle cx="1140" cy="20" r="340" fill="#0a2940" opacity=".45"/>
    <circle cx="80" cy="780" r="260" fill="#071c2c"/>
    <rect x="365" y="62" width="550" height="676" rx="22" fill="#080d19" stroke="#1e3347" stroke-width="2"/>
    <image href="${logo}" x="394" y="88" width="42" height="42"/>
    <text x="451" y="120" font-family="Helvetica,Arial,sans-serif" font-size="28" font-weight="700" fill="#7c86ff">Decker</text>
    <text x="873" y="119" font-family="Helvetica,Arial,sans-serif" font-size="25" fill="#5a8099">&#9881;</text>
    ${content}
  </svg>`);
}

function text(x, y, value, size = 17, fill = "#e8f4fb", weight = 400) {
  return `<text x="${x}" y="${y}" font-family="Helvetica,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
}

async function main() {
  await fs.mkdir(out, { recursive: true });
  const logo = await logoData();

  const setup = `
    <rect x="394" y="153" width="492" height="474" rx="14" fill="#0c1426" stroke="#1e3347"/>
    <rect x="414" y="176" width="215" height="46" rx="8" fill="#7c86ff"/>
    ${text(493, 205, "OpenAI", 16, "#080d19", 700)}
    <rect x="639" y="176" width="227" height="46" rx="8" fill="#080d19" stroke="#2a3854"/>
    ${text(723, 205, "Gemini", 16, "#e8f4fb", 700)}
    ${text(414, 257, "OpenAI API key", 15, "#e8f4fb", 500)}
    <rect x="414" y="272" width="382" height="46" rx="8" fill="#080d19" stroke="#3b82f6" stroke-width="2"/>
    ${text(432, 302, "••••••••••••••••••••", 19, "#e8f4fb", 500)}
    <rect x="806" y="272" width="60" height="46" rx="8" fill="#080d19" stroke="#2a3854"/>
    ${text(820, 301, "Show", 13, "#8da0bc", 500)}
    ${text(414, 345, "Get an OpenAI API key", 13, "#7c86ff", 500)}
    ${text(414, 382, "Decker saves this key in extension storage.", 14, "#8da0bc", 400)}
    ${text(414, 407, "Requests go directly to OpenAI; the developer does", 14, "#8da0bc", 400)}
    ${text(414, 432, "not receive your key or meeting content.", 14, "#8da0bc", 400)}
    <rect x="414" y="464" width="300" height="48" rx="9" fill="#7c86ff"/>
    ${text(526, 495, "Save key", 17, "#080d19", 700)}
    <rect x="724" y="464" width="142" height="48" rx="9" fill="#080d19" stroke="#2a3854"/>
    ${text(759, 495, "Clear key", 16, "#e8f4fb", 600)}
    <rect x="414" y="542" width="452" height="56" rx="9" fill="#091f30" stroke="#153c55"/>
    ${text(437, 567, "Save runs live text and audio capability checks.", 13, "#9ab0c2", 400)}
    ${text(437, 587, "Provider quota or charges may apply.", 13, "#9ab0c2", 400)}
  `;

  const ready = `
    ${text(394, 174, "Ready to record", 19, "#e8f4fb", 700)}
    <rect x="394" y="195" width="492" height="158" rx="13" fill="#0c1426" stroke="#1e3347"/>
    ${text(418, 232, "Gemini key saved", 16, "#34d399", 600)}
    ${text(418, 270, "Browser meeting is ready to capture.", 16, "#34d399", 600)}
    ${text(418, 308, "Microphone ready", 16, "#34d399", 600)}
    <rect x="396" y="383" width="18" height="18" rx="3" fill="#7c86ff"/>
    ${text(400, 398, "✓", 14, "#080d19", 700)}
    ${text(426, 398, "Include my microphone", 15, "#e8f4fb", 500)}
    ${text(394, 444, "Decker records eligible browser tabs and checks the", 14, "#8da0bc", 400)}
    ${text(394, 468, "captured audio signal after starting. Native meeting apps", 14, "#8da0bc", 400)}
    ${text(394, 492, "are not supported.", 14, "#8da0bc", 400)}
    ${text(394, 532, "Audio and transcript content go directly to Gemini using", 14, "#8da0bc", 400)}
    ${text(394, 556, "your key. API charges may apply. One recovery session is", 14, "#8da0bc", 400)}
    ${text(394, 580, "stored on this device.", 14, "#8da0bc", 400)}
    <rect x="394" y="616" width="492" height="54" rx="10" fill="#7c86ff"/>
    ${text(566, 650, "Start recording", 18, "#080d19", 700)}
  `;

  await sharp(frame(setup, logo)).flatten({ background: "#05111e" }).removeAlpha().png()
    .toFile(path.join(out, "01-popup-single-key.png"));
  await sharp(frame(ready, logo)).flatten({ background: "#05111e" }).removeAlpha().png()
    .toFile(path.join(out, "02-popup-ready.png"));
  console.log("Generated two 1280x800 v0.1.4 Store screenshots from current provider and readiness copy");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
