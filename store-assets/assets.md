# Chrome Web Store asset inventory for Decker 0.1.4

| File | Dimensions or type | Required | Use |
| --- | --- | --- | --- |
| `decker-chrome.zip` | MV3 ZIP, version 0.1.3 until Task 5 | Yes | Rebuild for the 0.1.4 package upload |
| `../apps/extension/public/icons/icon128.png` | 128x128 RGBA PNG | Yes | Store icon |
| `screenshots/01-popup-single-key.png` | 1280x800 RGB PNG | Yes | OpenAI or Gemini provider setup |
| `screenshots/02-popup-ready.png` | 1280x800 RGB PNG | Yes | Browser-tab readiness and direct-provider disclosure |
| `screenshots/03-sample-output.png` | 1280x800 RGB PNG | Yes | Sample generated meeting artifact |
| `promo-440x280.png` | 440x280 RGB PNG | Yes | Small promotional tile |
| `marquee-1400x560.png` | 1400x560 RGB PNG | Optional | Marquee promotion eligibility |

The screenshots contain no testimonial, rating, usage claim, real API key, or
private meeting record. The sample output uses fictional product-review content. The
marquee and promo tile use the checked-in Decker logo and site palette.

Regenerate icons and promotional images with:

```sh
node scripts/generate-icons.js
node scripts/generate-store-screenshots.js
```

Task 5 rebuilds and validates the package and image dimensions with:

```sh
bash scripts/package-extension.sh chrome
python3 scripts/verify-extension.py
```
