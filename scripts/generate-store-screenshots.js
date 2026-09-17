#!/usr/bin/env node
// Rebuild Store screenshots from the current extension UI and checked-in logo.
// The images use fictional state only: masked key, test Meet, no private content.
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
    <rect x="394" y="153" width="492" height="250" rx="14" fill="#0c1426" stroke="#1e3347"/>
    <rect x="414" y="174" width="452" height="48" rx="9" fill="#080d19" stroke="#2a3854"/>
    ${text(520, 205, "Allow microphone", 17, "#9aa8c2", 600)}
    ${text(414, 253, "OpenAI key", 15, "#8da0bc", 400)}
    ${text(502, 253, "sk-...", 15, "#34d399", 500)}
    ${text(555, 253, "transcription, topics, generation", 14, "#6f819e", 400)}
    <rect x="414" y="269" width="392" height="46" rx="8" fill="#080d19" stroke="#3b82f6" stroke-width="2"/>
    ${text(432, 299, "••••••••••••••••••••••••", 19, "#e8f4fb", 500)}
    <rect x="816" y="269" width="50" height="46" rx="8" fill="#080d19" stroke="#2a3854"/>
    ${text(832, 300, "view", 12, "#8da0bc", 500)}
    <rect x="414" y="332" width="452" height="48" rx="9" fill="#7c86ff"/>
    ${text(607, 363, "Save key", 18, "#080d19", 700)}
    ${text(394, 440, "Ready for the first meeting?", 18, "#e8f4fb", 700)}
    <rect x="394" y="458" width="492" height="140" rx="13" fill="#0c1426" stroke="#1e3347"/>
    ${text(418, 493, "1. OpenAI key saved", 16, "#34d399", 600)}
    ${text(418, 531, "2. Open a Google Meet tab", 16, "#fbbf24", 500)}
    ${text(418, 569, "3. Allow the microphone if you want your voice captured", 14, "#8da0bc", 400)}
    <rect x="394" y="620" width="492" height="52" rx="10" fill="#18213b"/>
    ${text(548, 653, "Open a test meeting", 17, "#c7d2fe", 700)}
    ${text(454, 706, "Your key stays in local extension storage.", 14, "#6f819e", 400)}
  `;

  const ready = `
    ${text(394, 174, "Ready for the first meeting?", 18, "#e8f4fb", 700)}
    <rect x="394" y="192" width="492" height="148" rx="13" fill="#0c1426" stroke="#1e3347"/>
    ${text(418, 229, "1. OpenAI key saved", 16, "#34d399", 600)}
    ${text(418, 267, "2. Google Meet tab ready", 16, "#34d399", 600)}
    ${text(418, 305, "3. Microphone allowed", 16, "#34d399", 600)}
    ${text(394, 382, "Meet tab ready", 16, "#34d399", 600)}
    ${text(530, 382, "Microphone ready", 16, "#34d399", 600)}
    <rect x="394" y="408" width="492" height="58" rx="11" fill="#7c86ff"/>
    ${text(549, 444, "Start Recording", 19, "#080d19", 700)}
    ${text(394, 507, "Start Recording sends Meet audio and your microphone,", 15, "#8da0bc", 400)}
    ${text(394, 532, "when available, directly to OpenAI for transcription.", 15, "#8da0bc", 400)}
    ${text(394, 557, "Transcript content and selected topics also go to OpenAI.", 15, "#8da0bc", 400)}
    ${text(394, 582, "API charges apply. Obtain any required participant consent.", 15, "#8da0bc", 400)}
    <rect x="394" y="622" width="492" height="66" rx="11" fill="#091f30" stroke="#153c55"/>
    ${text(417, 649, "What stays local", 14, "#1aade4", 700)}
    ${text(417, 675, "No Decker account and no automatic developer telemetry.", 14, "#9ab0c2", 400)}
  `;

  await sharp(frame(setup, logo)).flatten({ background: "#05111e" }).removeAlpha().png()
    .toFile(path.join(out, "01-popup-single-key.png"));
  await sharp(frame(ready, logo)).flatten({ background: "#05111e" }).removeAlpha().png()
    .toFile(path.join(out, "02-popup-ready.png"));
  console.log("Generated two 1280x800 v0.1.3 Store screenshots from current setup copy and brand assets");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
