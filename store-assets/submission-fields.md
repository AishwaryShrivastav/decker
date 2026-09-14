# Chrome Web Store submission fields

Prepared for the Decker 0.1.1 draft on September 14, 2026. Recheck the
permission justifications if the package changes before submission.

## Listing

- Category: Workflow and planning
- Language: English
- Homepage: https://decker.techforgood.studio
- Support: https://github.com/AishwaryShrivastav/decker/issues
- Mature content: Off

Use the full description in [listing.md](listing.md).

## Single purpose

```
Decker lets a user record the audio from an active Google Meet after an explicit click, transcribe that audio with the user's OpenAI API key, and turn the meeting transcript into notes, slide decks, interactive HTML prototypes, discussion pages, or structured briefs.
```

## Permission justifications

### tabCapture

```
Used only after the user clicks Start Recording to capture audio from the active Google Meet tab. Decker does not capture video.
```

### tabs

```
Used when the popup opens and when recording starts to find the active tab, verify that its URL is meet.google.com, and obtain the tab ID used for capture.
```

### storage

```
Stores the user's OpenAI API key and up to 15 recent debug events in chrome.storage.local. It does not use Chrome Sync. The key authenticates direct browser-to-OpenAI requests.
```

### activeTab

```
Provides temporary access to the current Google Meet tab after the user invokes the extension so Decker can verify the page and begin the user-requested recording.
```

### offscreen

```
Runs MediaRecorder in an offscreen extension document so capture and transcription can continue when the popup closes. It also attempts microphone capture after browser permission is granted.
```

### downloads

```
Saves the generated meeting brief, slide deck, prototype, or discussion page as an HTML file in the user's Downloads folder after the user clicks Download.
```

### Host permissions

```
https://api.openai.com/* is required for direct transcription and chat-completion requests authenticated with the user's key. https://meet.google.com/* limits the packaged content-script match to Google Meet; the current content script does not read or modify page content.
```

## Remote code

Select **No, I am not using remote code**.

The extension runtime executes only JavaScript bundled in its package. It does
not import remote scripts, evaluate downloaded code, or execute remote WebAssembly.

## Data usage

Select:

- Personally identifiable information
- Authentication information
- Personal communications
- Website content

Leave health, financial and payment information, location, web history, and
user activity unselected.

Certify all three limited-use disclosures. Decker sends the user's key, audio,
transcript, selections, instructions, and generated-content prompts directly to
OpenAI for the product's stated purpose. It does not sell data, use it for an
unrelated purpose, or use it for lending or creditworthiness.

Privacy policy URL:

```
https://decker.techforgood.studio/privacy
```

## Reviewer instructions

Leave username and password blank. Use:

```
No Decker account is required. Use a Google Meet test call, microphone permission, and your own OpenAI API key. Open the popup, save the key, join Meet, click Start Recording, speak or play tab audio for at least 20 seconds, then stop. Review the transcript, select a topic and output format, and click Generate. The HTML output can be opened or downloaded. OpenAI bills API usage to the supplied key.
```

## Distribution

- Free of charge
- Public
- All regions
