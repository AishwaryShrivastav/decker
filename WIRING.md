# Decker Chunked Transcription Wiring

## Message Flow

```
[Popup] Start Recording (user gesture)
    │
    ├─► chrome.tabCapture.getMediaStreamId(tabId)
    │
    └─► START_RECORDING_WITH_STREAM { tabId, streamId }
            │
            ▼
[Background] startRecordingWithStream()
    │
    ├─► ensureOffscreenDocument()
    ├─► OFFSCREEN_START { streamId }
    └─► broadcastStatus("recording")
            │
            ├─► chrome.runtime.sendMessage(STATUS_UPDATE)  → Popup, Content
            └─► chrome.tabs.sendMessage(tabId, STATUS_UPDATE)  → Content script in Meet tab
            │
            ▼
[Offscreen] startRecording()
    │
    ├─► getUserMedia(tab + mic)
    ├─► MediaRecorder.start(2000)  ← chunks every 2s
    │
    └─► ondataavailable (every 2s)
            │
            ├─► Push chunk to audioChunks[]
            └─► When audioChunks.length >= 8:
                    │
                    ├─► splice(0, 8) → Blob
                    ├─► blobToBase64()
                    └─► AUDIO_CHUNK { base64, mimeType }  ─────┐
                            │                                  │
                            ▼                                  ▼
[Background] AUDIO_CHUNK handler                        [Background] processChunkQueue()
    │                                                       │
    ├─► chunkQueue.push({ base64, mimeType })               ├─► transcribeChunk() → fetch /api/transcribe
    └─► processChunkQueue()                                 ├─► accumulatedTranscript += text
                                                            └─► broadcastStatus("recording", { transcript })
                                                                    │
                                                                    └─► STATUS_UPDATE → Popup, Content
                                                                            │
                                                                            ▼
                                                                    [Popup/DeckerPanel] Show "Live meeting notes"

[User] Stop
    │
    ▼
[Background] STOP_RECORDING
    │
    ├─► broadcastStatus("processing")
    └─► OFFSCREEN_STOP
            │
            ▼
[Offscreen] mediaRecorder.stop()
    │
    └─► onstop
            │
            ├─► Blob(remaining audioChunks)  ← tail (0–14 sec not yet sent)
            ├─► STATUS_UPDATE { status: "finalizing" }
            └─► RECORDING_STOPPED { base64, mimeType }
                    │
                    ▼
[Background] runPhase1()
    │
    ├─► Wait for chunkQueue to drain
    ├─► Transcribe final blob (if size >= 1KB)
    ├─► transcript = accumulatedTranscript + finalSegment
    ├─► POST /api/extract-points
    └─► broadcastStatus("reviewing", { transcript, points })
            │
            └─► [Popup/DeckerPanel] Review UI, select points, Generate Deck
```

## Verified Connections

| From | To | Message | Payload | Verified |
|------|----|---------|---------|----------|
| Popup | Background | START_RECORDING_WITH_STREAM | { tabId, streamId } | ✓ |
| Background | Offscreen | OFFSCREEN_START | { streamId } | ✓ |
| Offscreen | Background | AUDIO_CHUNK | { base64, mimeType } | ✓ |
| Offscreen | Background | RECORDING_STOPPED | { base64, mimeType } | ✓ |
| Offscreen | Background | STATUS_UPDATE | { status, message? } | ✓ |
| Background | Popup/Content | STATUS_UPDATE | { status, message?, transcript?, points? } | ✓ |
| Popup | Background | STOP_RECORDING | — | ✓ |
| Content | Background | STOP_RECORDING | — | ✓ |

## Debug Logs (Recent logs in Settings)

- `AUDIO_CHUNK received, queue size: N`
- `Chunk transcribed (X chars), total: Y`
- `Chunk transcribe FAILED: <error>`
- `runPhase1: waiting for chunk queue to drain…`
- `runPhase1: queue drained, accumulated: N chars`

## Fixes Applied

1. **Chrome manifest** – Added `content_scripts` so DeckerPanel loads on meet.google.com
2. **RecordingStatus** – Added `"finalizing"` for offscreen “Preparing audio…” state
3. **blobToBase64** – Safe fallback when `split(",")[1]` is undefined
4. **AUDIO_CHUNK send** – Catch and log send failures from offscreen
5. **Debug logging** – Chunk queue, transcription success/fail, runPhase1 drain
