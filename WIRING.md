# Decker capture and recovery

This document describes extension behavior. See [the data-flow and permission audit](store-assets/privacy.md) for network transmission, local storage, output, and Chrome Web Store disclosures.

The popup requests a tab stream after checking that a saved OpenAI key exists. The worker waits for settings and the local session to load before handling requests. Key preflight checks presence; account validity, quota, and model access are checked by actual API calls.

The offscreen document checks for a live tab audio track, attempts microphone capture, and starts a mixed audio recorder. Missing microphone access, disconnected sources, and an initial lack of audio signal produce persistent warnings. Tab audio is still routed to the speakers.

## Ordered audio and stop

Each 16-second segment uses a separate MediaRecorder container. This avoids prepending the first segment's audio as a header to every later segment. Recorder rotation needs real-call testing for boundary gaps.

The recorder's final `dataavailable` event precedes `stop` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop_event)). Decker includes that data without a minimum-size cutoff. An empty tail still sends a final marker.

`AudioDelivery` serializes conversion and delivery. Each message carries a session ID and sequence number. The worker acknowledges only after the session and pending audio are saved in IndexedDB. Duplicate delivery cannot append the same segment twice. Failed sends get three attempts and their segment numbers travel with the final marker. The offscreen document retains the final payload for another delivery attempt when a worker restart or reopened popup probes it.

Live and final audio share one ordered transcription queue. Each request has a 20-second timeout, at most three attempts, and 1- and 2-second retry delays. Attempt counts survive worker restarts. Exhaustion inserts a missing-segment marker in the transcript and a persistent warning. Empty transcription responses also exhaust into a warning because silence cannot be distinguished reliably from a failed speech result.

Review begins after the final marker and queue drain. The complete transcript is published before topic extraction. Extraction failure returns to review with the transcript intact. Live extraction results arriving after stop cannot return the status to recording.

## Review and closing artifact

The worker owns the canonical transcript and its revision. Popup text is an edit only after the user changes it; an edit includes its base revision. A stale edit cannot override later segments. Generation rejects stale explicit edits, while unedited requests use the worker's complete transcript.

Selections are stored by topic text, so reordering and popup closure preserve deliberate deselections. Custom instructions, output format, explicit edits, warnings, research results, and the last generated HTML are also saved. Generation failures return to review. Users can copy the transcript independently of generation. Generated HTML includes an escaped capture-warning notice whenever warnings exist.

## Recovery limits

One local IndexedDB record holds the current session without API credentials. Pending audio is removed after transcription finishes or fails after three attempts. A new recording or Start over replaces the record.

Worker restart resumes pending transcription and finalization. Interrupted generation returns to review without automatically starting another paid generation request. If the recorder is gone, saved text and queued audio remain recoverable and Decker warns that unsaved audio may be missing. Audio still in the recorder or an undelivered offscreen message cannot survive termination of that document or the browser. Storage write failures are visible and audio delivery is not acknowledged as saved.

## Verification and real-Meet checks

Automated tests use synthetic audio, API responses, and Chrome lifecycle events. Run `pnpm --filter extension test`, `pnpm --filter extension exec tsc --noEmit`, and `pnpm --filter extension build`. Decker v0.1.4 supports Chromium browsers only. The repository does not produce a Firefox artifact because Firefox capture has no implemented recorder path.

Before release, load the Chrome build and check these in a real Meet call:

- Record remote speech and local microphone speech, then verify both in the transcript and document.
- Speak a distinct final decision, stop immediately, and confirm it reaches review and the generated artifact. Repeat just before, during, and after the 16-second segment boundary; listen for boundary gaps or duplicated words.
- Close/reopen the popup during recording and review. Confirm deselections, instructions, output format, and edits survive.
- Terminate the service worker during capture, transcription, and finalization. Reopen the popup and confirm pending audio resumes without duplicate segments. Repeat after generation starts; expect recovered review inputs and an explicit interruption message.
- Deny microphone access, disconnect a source, and begin with silent tab audio. Confirm the warnings describe the actual source problem and remain in the exported HTML.
- Simulate transcription timeout/429/5xx failures. Confirm three attempts per segment, visible exhaustion warnings, later segments retained, and review reached after stop.
- Close the Meet tab or terminate the browser mid-capture. Confirm saved text is recovered and possible unsaved audio loss is disclosed.
