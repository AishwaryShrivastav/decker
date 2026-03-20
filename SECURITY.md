# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **aish@techforgood.studio** with:

- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix (optional)

You'll receive a response within 48 hours. Once the issue is confirmed and fixed, a public disclosure will be made with credit to the reporter (if desired).

## Security Model

Decker is a Chrome Extension + optional landing page. Here's what you need to know:

### API Key Storage

Your OpenAI (or Claude) API key is stored in `chrome.storage.local` — a per-extension sandboxed storage area inside your browser. It is:

- **Never sent to any Decker server** — calls go directly from your browser to `api.openai.com`
- **Not accessible to web pages** — `chrome.storage.local` is only accessible to the extension itself
- **Not synced across devices** — it stays on the machine you entered it on

**Limitation:** If someone gains physical access to your Chrome profile, they could potentially read your stored key. Treat it like any other browser-stored credential.

### What Decker Sends Over the Network

| Data | Destination | When |
|------|-------------|------|
| Audio file (WebM) | `api.openai.com/v1/audio/transcriptions` | When you stop recording |
| Transcript text | `api.openai.com/v1/chat/completions` | To extract discussion points |
| Transcript + selected points | `api.openai.com/v1/chat/completions` | When you generate a deck |

No data is sent to any Decker-operated server.

### What Decker Does NOT Do

- Store recordings, transcripts, or presentations
- Track usage or analytics
- Phone home to any Decker server
- Access tabs other than the active Google Meet tab

### Extension Permissions

| Permission | Why it's needed |
|------------|-----------------|
| `tabCapture` | Records the audio from the Google Meet tab |
| `tabs` | Detects when you're on a Google Meet URL |
| `storage` | Saves your API key and debug logs locally |
| `activeTab` | Opens the microphone permission page |
| `offscreen` | Keeps the MediaRecorder alive while the service worker sleeps |
| `downloads` | Saves the generated HTML file to your Downloads folder |

None of these permissions are used beyond their stated purpose.

### Open Source Transparency

The entire codebase is MIT licensed and publicly auditable. There is no obfuscated code, no telemetry, and no backend that handles user data.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes    |
