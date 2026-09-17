# Chrome Web Store fields for Decker 0.1.3

Copy these values into the existing item. They were audited against the packaged
manifest and source on September 17, 2026.

## Store listing

Use [listing.md](listing.md) for the title, description, links, category, and
distribution values.

## Single purpose

```
Decker records audio from the active Google Meet after the user clicks Start Recording, transcribes it through OpenAI with the user's API key, and turns the reviewed transcript into a meeting brief, slide deck, discussion page, or static prototype.
```

## Permission justifications

### tabCapture

```
Used only after the user clicks Start Recording to capture audio from the active Google Meet tab. Decker does not capture video.
```

### storage

```
Stores the user's OpenAI API key, up to 15 recent debug events, and four timestamp-only activation milestones in chrome.storage.local. One recoverable working session is stored in local IndexedDB. Decker does not use Chrome Sync or send this local data automatically to the developer.
```

### activeTab

```
Provides temporary access to the active tab after the user invokes Decker. The extension checks that the tab is a Google Meet and passes that tab's ID to tabCapture. It requests no persistent access to Google Meet.
```

### offscreen

```
Runs MediaRecorder in an offscreen extension document so audio capture and transcription can continue after the popup closes. The offscreen document also attempts microphone capture after the user grants browser permission.
```

### downloads

```
Saves the generated meeting brief, slide deck, discussion page, or static prototype as an HTML file after the user clicks Download.
```

### Host permission: https://api.openai.com/*

```
Sends authenticated HTTPS requests directly from the extension to OpenAI for audio transcription, topic extraction, topic summaries, and output generation. Requests use the OpenAI API key supplied by the user. Decker has no other persistent host permission.
```

## Remote code

Select:

```
No, I am not using remote code.
```

Use this explanation in reviewer notes if the dashboard offers a text field:

```
All extension runtime JavaScript is included in the uploaded package. The extension does not import remote scripts, call eval on downloaded code, or load remote WebAssembly. OpenAI returns user-requested HTML output. Decker saves that output to Downloads and can open it in a separate browser tab; the output is user content, not extension runtime code. The listing and in-product disclosure tell users that generated HTML can contain external resources or code and must be reviewed before opening or sharing.
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

Reasoning:

- Meeting audio, transcripts, instructions, and generated artifacts can contain
  names or other identifying information, so personally identifiable information
  is the conservative declaration.
- The OpenAI API key is authentication information.
- Meeting audio and transcripts are personal communications.
- Audio from the active Meet tab and transcript content are conservatively
  disclosed as website content.
- Four local timestamps record when the user saves a key, starts a recording,
  receives a transcript, and generates an output. That is user activity even
  though it stays on the device unless the user puts it in a feedback email.
- Decker does not extract dedicated health, financial, location, browsing
  history, or continuous behavioral analytics fields. Content mentioned during
  a meeting remains covered by the selected communication and content categories.

## Data-use certifications

Check all three dashboard certifications after comparing the wording shown in
the dashboard with the current product:

- Data is not sold to third parties outside approved use cases.
- Data is not used or transferred for purposes unrelated to Decker's single
  purpose.
- Data is not used or transferred to determine creditworthiness or for lending.

OpenAI is the disclosed processor for transcription and generation. The
developer receives only voluntary support or pilot messages that the user sends.

## Privacy policy URL

```
https://decker.techforgood.studio/privacy
```

## Reviewer notes

```
This is an update from 0.1.2 to 0.1.3. No Decker account, username, or password is required. The extension requires a Google Meet tab, microphone permission if the review should include the reviewer's voice, and an OpenAI API key supplied by the reviewer. OpenAI bills API usage to that key.

Test path:
1. Pin Decker and open https://meet.new in Chrome.
2. Join the meeting and click the Decker toolbar icon.
3. Open Settings, paste an OpenAI API key, and click Save key.
4. Click Allow microphone and grant access if microphone capture is desired.
5. Return to the Meet tab, open Decker, and click Start Recording.
6. Speak or play tab audio for at least 20 seconds, then click Stop & Transcribe.
7. Review or edit the transcript, select one or more topics, choose an output, and click Generate.
8. Open or download the generated HTML.

Expected network traffic is limited to https://api.openai.com for transcription and generation. The extension sends no automatic telemetry to the developer. Version 0.1.3 adds first-meeting setup guidance, four timestamp-only local activation milestones, and a Share first-meeting feedback button that opens an unsent email draft. It does not send the draft automatically.

Generated HTML is user-requested output. It can contain external resources or code supplied by the model. The extension discloses this before the user opens or shares an output.
```

## Distribution

- Status: Public
- Pricing: Free of charge
- Regions: All regions
- Mature content: Off
