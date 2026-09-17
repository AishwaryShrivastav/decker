#!/usr/bin/env python3
"""Verify the Chrome submission ZIP against its source assets and current build."""
import json
from pathlib import Path, PurePosixPath
import re
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "apps/extension/dist"
PUBLIC = ROOT / "apps/extension/public"
ZIP = ROOT / "store-assets/decker-chrome.zip"


def png_info(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "Expected PNG"
    assert data[12:16] == b"IHDR", "Missing PNG header"
    return struct.unpack(">IIBB", data[16:26])  # width, height, depth, color type


with zipfile.ZipFile(ZIP) as archive:
    assert archive.testzip() is None, "ZIP CRC failure"
    entries = [i.filename for i in archive.infolist() if not i.is_dir()]
    assert len(entries) == len(set(entries)), "Duplicate archive entries"
    assert all(not p.startswith("/") and ".." not in PurePosixPath(p).parts for p in entries)
    assert all(PurePosixPath(p).suffix in {".js", ".html", ".json", ".png"} for p in entries), "Unexpected packaged file type"
    built = {p.relative_to(DIST).as_posix() for p in DIST.rglob("*") if p.is_file()}
    assert set(entries) == built, "Archive differs from current build tree"
    for name in entries:
        assert archive.read(name) == (DIST / name).read_bytes(), f"Stale ZIP entry: {name}"
    manifest = json.loads(archive.read("manifest.json"))
    assert archive.read("manifest.json") == (PUBLIC / "manifest.json").read_bytes()
    assert manifest["manifest_version"] == 3
    assert re.fullmatch(r"\d+(\.\d+){0,3}", manifest["version"])
    assert len(manifest["description"]) <= 132
    listing = (ROOT / "store-assets/listing.md").read_text()
    assert manifest["name"] in listing and manifest["description"] in listing
    assert set(manifest["permissions"]) == {"tabCapture", "storage", "activeTab", "offscreen", "downloads"}
    assert set(manifest["host_permissions"]) == {"https://api.openai.com/*"}
    assert "content_scripts" not in manifest, "Chrome package must not inject a Meet content script"
    assert "src/content/index.js" not in entries, "Chrome package contains the retired content script"
    required = [manifest["background"]["service_worker"], manifest["action"]["default_popup"],
                "src/offscreen/index.html", "permission.html", "permission.js"]
    for content in manifest.get("content_scripts", []):
        required.extend(content.get("js", []) + content.get("css", []))
    for name in required:
        assert name in entries, f"Missing manifest/runtime asset: {name}"
    for size in (16, 48, 128):
        name = manifest["icons"][str(size)]
        assert manifest["action"]["default_icon"][str(size)] == name
        data = archive.read(name)
        assert png_info(data)[:2] == (size, size), f"Wrong icon dimensions: {name}"
        assert data == (PUBLIC / name).read_bytes(), f"Stale icon: {name}"
    for name in entries:
        if name.endswith(".html"):
            html = archive.read(name).decode()
            for src in re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+)', html):
                assert not src.startswith(("https:", "http:", "//")), "Remote packaged entry script"
                target = (PurePosixPath(name).parent / src).as_posix()
                assert target in entries, f"Missing HTML script: {target}"
    background = archive.read(manifest["background"]["service_worker"]).decode()
    assert "https://api.openai.com/v1" in background
    assert '/api/transcribe' not in background and '/api/generate-deck' not in background
    assert ".tabs.sendMessage" not in background, "Background still targets the retired content script"
    popup = archive.read("src/popup/index.js").decode()
    assert "directly to OpenAI" in popup and "API charges apply" in popup

for relative, expected in {
    "promo-440x280.png": (440, 280),
    "marquee-1400x560.png": (1400, 560),
}.items():
    width, height, depth, color = png_info((ROOT / "store-assets" / relative).read_bytes())
    assert (width, height) == expected, f"Wrong dimensions: {relative}"
    assert (depth, color) == (8, 2), f"{relative} must be an opaque 8-bit RGB PNG"

screenshots = sorted((ROOT / "store-assets/screenshots").glob("*.png"))
assert 1 <= len(screenshots) <= 5, "Chrome requires 1 to 5 screenshots"
for screenshot in screenshots:
    width, height, depth, color = png_info(screenshot.read_bytes())
    assert (width, height) in {(1280, 800), (640, 400)}, f"Wrong screenshot dimensions: {screenshot.name}"
    assert depth == 8 and color in {2, 6}, f"Unexpected screenshot format: {screenshot.name}"

print(f"Verified {len(entries)} ZIP files against build; MV3 {manifest['version']}; manifest, scripts, disclosures, icons, promotional assets, and {len(screenshots)} screenshots.")
print("Source/build checks do not certify live recording, generated output safety, or store approval.")
