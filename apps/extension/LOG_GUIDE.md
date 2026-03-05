# Decker Extension — Where to View Logs

When debugging "stuck on Processing" or other issues, open these consoles to see what's happening.

## 1. Background Service Worker (main logs)

**Where:** `chrome://extensions` → Find Decker → click **"Inspect views: service worker"**

**Shows:** All background script logs. Look for:
- `[Decker background] STOP_RECORDING received → sending OFFSCREEN_STOP`
- `[Decker background] OFFSCREEN_STOP sent, waiting for RECORDING_STOPPED…`
- `[Decker background] RECORDING_STOPPED received!` ← If you never see this, the offscreen didn't send it
- `[Decker background] Calling /api/transcribe…`
- `[Decker background] Transcribe response: 200 OK` (or error)
- `[Decker background] runPhase1 failed:` (errors)

---

## 2. Offscreen Document (recording & base64)

**Where:** `chrome://extensions` → Decker → **"Inspect views"** → look for **"offscreen document"**  
*Note: This link only appears while recording or right after you stop (while the offscreen doc is active).*

**Shows:**
- `[Decker offscreen] OFFSCREEN_STOP received, stopping MediaRecorder…`
- `[Decker offscreen] Recording stopped, blob size: X chunks: Y`
- `[Decker offscreen] Converting blob to base64…`
- `[Decker offscreen] Base64 ready, sending RECORDING_STOPPED to background…`

If you don't see "OFFSCREEN_STOP received", the message never reached the offscreen doc.  
If you see it but never see "RECORDING_STOPPED" in the background logs, the offscreen didn't finish.

---

## 3. Decker Panel (in Meet tab)

**Where:** On the **Google Meet** tab → Right-click → **Inspect** → **Console** tab

**Shows:** `[Decker panel] Status update: processing` (or transcribing, reviewing, error, etc.)

---

## 4. Web API (Next.js server)

**Where:** Terminal where you ran `pnpm --filter web dev`

**Shows:** `[/api/transcribe] Transcribing recording.webm, size: X bytes` and any API errors.

---

## Quick diagnosis

| What you see                           | Likely cause                                              |
|----------------------------------------|-----------------------------------------------------------|
| "OFFSCREEN_STOP sent" but no RECORDING_STOPPED | Offscreen doc didn't receive stop, or blob was too small |
| RECORDING_STOPPED received, then stuck | Transcribe API call failing (check API logs, network)     |
| Transcribe 200 OK, then error          | Empty transcript or extract-points failed                 |
| No logs at all                         | Service worker may have restarted — reload extension      |
