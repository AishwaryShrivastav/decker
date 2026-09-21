# Chrome Web Store fields for Decker 0.1.4

These fields are prepared for the next Store update. Compare them with the
final version 0.1.4 package before submission.

## Store listing

Use [listing.md](listing.md) for the title, descriptions, links, category, and
distribution values.

## Single purpose

```text
Decker records audio from an active eligible browser meeting tab after the user clicks Start Recording, transcribes it through the user's selected provider, and turns the reviewed transcript into an HTML meeting document, presentation, discussion page, or prototype.
```

## Permission justifications

### tabCapture

```text
Used only after the user clicks Start Recording to capture audio from the active eligible browser tab. Decker does not capture video. Muted or recently silent tabs show a warning, then captured-track and signal checks decide whether recording can continue.
```

### storage

```text
Stores the user's selected provider and API key, up to 15 recent debug events, and four timestamp-only activation milestones in chrome.storage.local. One recoverable working session is stored in local IndexedDB and can contain pending audio, transcript text, instructions, warnings, topic context, and generated HTML. Decker does not use Chrome Sync or send this local data automatically to the developer.
```

### activeTab

```text
Provides temporary access to the active tab after the user invokes Decker. The extension checks whether the page is eligible and passes its tab ID to tabCapture. It requests no persistent access to meeting sites.
```

### offscreen

```text
Runs MediaRecorder in an offscreen extension document so audio capture can continue after the popup closes. The document also attempts microphone capture after the user grants browser permission and performs captured-track and signal checks.
```

### downloads

```text
Saves the generated meeting document, presentation, discussion page, or prototype as an HTML file after the user clicks Download HTML.
```

### Host permission: https://api.openai.com/*

```text
Sends authenticated HTTPS requests directly from the extension to OpenAI for live key validation, audio transcription, topic extraction, topic context, and artifact generation when the user selects OpenAI. Requests use the OpenAI API key supplied by the user.
```

### Host permission: https://generativelanguage.googleapis.com/*

```text
Sends authenticated HTTPS requests directly from the extension to Gemini for live key validation, temporary audio upload and deletion, transcription, topic extraction, topic context, and artifact generation when the user selects Gemini. Decker requests transcription with storage disabled, waits for temporary file deletion, retries deletion up to three times, and shows a warning if cleanup cannot be confirmed.
```

## Remote code

Select:

```text
No, I am not using remote code.
```

Reviewer explanation:

```text
All extension runtime JavaScript is included in the uploaded package. The extension does not import remote scripts, evaluate downloaded code, or load remote WebAssembly. OpenAI or Gemini returns user-requested HTML output. Decker stores that output in the local recovery session and can save it to Downloads. Generated HTML is user content and can contain external resources or executable code, so the extension and Store listing tell users to review it before opening or sharing it.
```

## User data categories

Select these five categories:

- Personally identifiable information
- Authentication information
- Personal communications
- Website content
- User activity

Leave these categories unselected:

- Health information
- Financial and payment information
- Location
- Web history

Meeting audio, transcripts, instructions, and generated artifacts can contain
names or other identifying details. The provider key is authentication
information. Meeting audio and transcripts are personal communications. Audio
from the active tab and transcript content are disclosed as website content.
Four local timestamps record key save, recording start, transcript readiness,
and output generation.

Decker does not extract dedicated health, financial, location, browsing-history,
or continuous behavioral analytics fields. Sensitive information spoken during
a meeting remains covered by the selected communication and content categories.

## Data-use certifications

Check all three dashboard certifications after comparing the dashboard wording
with the final package:

- Data is not sold to third parties outside approved use cases.
- Data is not used or transferred for purposes unrelated to Decker's single
  purpose.
- Data is not used or transferred to determine creditworthiness or for lending.

OpenAI and Gemini are the disclosed processing options. The developer receives
only support, pilot, or issue content that a user chooses to send.

## Privacy policy URL

```text
https://decker.techforgood.studio/privacy
```

## Reviewer notes

```text
This update adds OpenAI or Gemini provider choice, live key capability checks, browser-tab meeting capture, and a separate transcript review page. No Decker account is required. The reviewer supplies an OpenAI or Gemini API key with billing or quota for the required transcription and text models.

Test path:
1. Pin Decker and open a meeting in a regular Chromium browser tab.
2. Open Decker, choose OpenAI or Gemini, paste a valid key, and click Save key.
3. Wait for validation to check both text models and audio transcription. The audio check uses a generated silent sample.
4. Allow microphone access if the review should include the reviewer's voice, or turn off Include my microphone.
5. Return to the active meeting tab and click Start Recording. A muted or recently silent tab can show a warning before the captured signal is checked.
6. Speak or play tab audio for at least 20 seconds, then click Stop recording.
7. Use the review page to correct the transcript, select topics, choose an output, and click Generate artifact.
8. Download the HTML and open the saved file.

OpenAI mode sends validation, transcription, and generation requests only to https://api.openai.com. Gemini mode sends those requests to https://generativelanguage.googleapis.com. Gemini transcription uploads temporary audio, requests processing with storage disabled, waits for deletion, retries failed deletion up to three times, and records a visible warning if cleanup cannot be confirmed.

The extension sends no automatic meeting-content telemetry to the developer. Native meeting apps cannot be captured. Generated HTML can contain external resources or executable code supplied by the model and should be reviewed before opening or sharing.
```

## Distribution

- Status: Public
- Pricing: Free of charge
- Regions: All regions
- Mature content: Off
