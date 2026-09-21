# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **aish@techforgood.studio** with:

- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix (optional)

You'll receive a response within 48 hours. Once the issue is confirmed and fixed, a public disclosure will be made with credit to the reporter (if desired).

## Security model

The Chrome extension calls OpenAI directly with the user's key. Audio batches are sent during recording and after stopping; transcript content, topics, instructions, and research context are sent for text processing. The extension has no developer telemetry endpoint. Separate web API routes exist in this repository and receive submitted data on their host if called; the extension does not call them.

The key and up to 15 debug events are stored in `chrome.storage.local`, without application-level encryption or Chrome sync. Logs can contain topic text and API error responses. People with access to the browser profile may be able to read these values. One recovery session is stored in local IndexedDB and can include pending audio segments, transcript text, selected topics, instructions, edits, warnings, research results, and generated HTML. Pending audio is removed after transcription succeeds or exhausts three attempts. Recovery limits data loss, but it is not a complete recording archive. Generated HTML files persist in Downloads until deleted. The Clear key action removes the saved provider settings and legacy OpenAI key. Uninstalling clears extension storage, but does not remove downloads or provider-side data.

Generated HTML can contain external fonts, scripts, and other model-generated resources. Opening an output can make network requests or execute generated code. Review outputs before opening or sharing them.

See [the data-flow and permission audit](store-assets/privacy.md) for the exact declared permissions, their current use, and permission-minimization issues requiring review before submission. Do not include API keys or unredacted meeting content in support reports.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes    |
