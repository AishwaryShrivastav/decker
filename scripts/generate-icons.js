#!/usr/bin/env node
/**
 * Generates Docker-inspired Decker extension icons as PNG files.
 * Uses only Node.js built-ins (zlib + Buffer) — no dependencies needed.
 *
 * Design: Docker blue (#2496ED) rounded-square background,
 * white whale silhouette carrying "slide" containers.
 */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG builder ────────────────────────────────────────────────────────────
function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crcBytes = Buffer.allocUnsafe(4);
  crcBytes.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, typeBytes, data, crcBytes]);
}

function buildPNG(pixels, w, h) {
  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  // Raw scanlines (filter byte 0 + RGB rows)
  const raw = Buffer.allocUnsafe(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const pi = (y * w + x) * 3;
      const ri = y * (1 + w * 3) + 1 + x * 3;
      raw[ri]     = pixels[pi];
      raw[ri + 1] = pixels[pi + 1];
      raw[ri + 2] = pixels[pi + 2];
    }
  }

  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Drawing helpers ────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function createCanvas(w, h, bg) {
  const [r, g, b] = hexToRgb(bg);
  const px = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) { px[i*3]=r; px[i*3+1]=g; px[i*3+2]=b; }
  return px;
}

function fillRect(px, w, x, y, rw, rh, color) {
  const [r, g, b] = hexToRgb(color);
  for (let dy = 0; dy < rh; dy++) {
    for (let dx = 0; dx < rw; dx++) {
      const px_ = x + dx, py_ = y + dy;
      if (px_ < 0 || py_ < 0 || px_ >= w) continue;
      const i = (py_ * w + px_) * 3;
      px[i]=r; px[i+1]=g; px[i+2]=b;
    }
  }
}

function fillCircle(px, w, cx, cy, r, color) {
  const [cr, cg, cb] = hexToRgb(color);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx*dx + dy*dy <= r*r) {
        const px_ = cx+dx, py_ = cy+dy;
        if (px_ < 0 || py_ < 0 || px_ >= w) continue;
        const i = (py_ * w + px_) * 3;
        px[i]=cr; px[i+1]=cg; px[i+2]=cb;
      }
    }
  }
}

function roundedRect(px, w, h, x, y, rw, rh, r, color) {
  // Fill inner rects
  fillRect(px, w, x+r, y,   rw-2*r, rh,   color);
  fillRect(px, w, x,   y+r, rw,     rh-2*r, color);
  // Four corner circles
  fillCircle(px, w, x+r,     y+r,     r, color);
  fillCircle(px, w, x+rw-r-1, y+r,     r, color);
  fillCircle(px, w, x+r,     y+rh-r-1, r, color);
  fillCircle(px, w, x+rw-r-1, y+rh-r-1, r, color);
}

// ── Icon renderer ──────────────────────────────────────────────────────────
function renderIcon(size) {
  const s = size;
  const px = createCanvas(s, s, "#1a1a2e"); // dark bg (transparent border)

  // Docker-blue rounded-square background
  const radius = Math.round(s * 0.18);
  roundedRect(px, s, s, 0, 0, s, s, radius, "#2496ED");

  const W = "#FFFFFF";
  const B = "#1D63ED"; // darker blue for containers

  if (size >= 48) {
    // ── Whale body (ellipse approximated) ──────────────────────────────────
    const bx = Math.round(s * 0.14);
    const by = Math.round(s * 0.50);
    const bw = Math.round(s * 0.72);
    const bh = Math.round(s * 0.26);
    const br = Math.round(bh * 0.5);
    roundedRect(px, s, s, bx, by, bw, bh, br, W);

    // ── Head bump ─────────────────────────────────────────────────────────
    fillCircle(px, s, Math.round(s * 0.72), Math.round(s * 0.52), Math.round(s * 0.12), W);

    // ── Tail (two lobes) ──────────────────────────────────────────────────
    const tx = Math.round(s * 0.06);
    const ty = Math.round(s * 0.44);
    fillCircle(px, s, tx, ty,                  Math.round(s * 0.10), W);
    fillCircle(px, s, tx, ty + Math.round(s*0.16), Math.round(s * 0.10), W);
    // Join tail to body
    fillRect(px, s, Math.round(s*0.06), Math.round(s*0.44), Math.round(s*0.12), Math.round(s*0.20), W);

    // ── Spout ─────────────────────────────────────────────────────────────
    const sx = Math.round(s * 0.68);
    fillRect(px, s, sx, Math.round(s*0.32), Math.round(s*0.04), Math.round(s*0.14), W);
    fillRect(px, s, sx - Math.round(s*0.04), Math.round(s*0.28), Math.round(s*0.10), Math.round(s*0.05), W);

    // ── Containers (3 slide boxes on whale back) ───────────────────────────
    const cw = Math.round(s * 0.14), ch = Math.round(s * 0.12);
    const cy2 = Math.round(s * 0.38);
    const gap = Math.round(s * 0.04);
    const startX = Math.round(s * 0.28);
    for (let i = 0; i < 3; i++) {
      const cx2 = startX + i * (cw + gap);
      roundedRect(px, s, s, cx2, cy2, cw, ch, 2, B);
      // Container line detail
      fillRect(px, s, cx2 + Math.round(cw*0.2), cy2 + Math.round(ch*0.3), Math.round(cw*0.6), 1, W);
    }
  } else {
    // ── 16px: simple whale silhouette ─────────────────────────────────────
    // Body
    roundedRect(px, s, s, 2, 8, 10, 5, 2, W);
    // Head
    fillCircle(px, s, 11, 9, 2, W);
    // Tail
    fillCircle(px, s, 1, 7, 2, W);
    fillCircle(px, s, 1, 11, 2, W);
    // Two containers
    fillRect(px, s, 4, 5, 3, 3, B);
    fillRect(px, s, 8, 5, 3, 3, B);
  }

  return buildPNG(px, s, s);
}

// ── Write icons ────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "../apps/extension/public/icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const buf = renderIcon(size);
  const outPath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✓ ${outPath} (${buf.length} bytes)`);
}

console.log("Done! Docker-inspired Decker icons generated.");
