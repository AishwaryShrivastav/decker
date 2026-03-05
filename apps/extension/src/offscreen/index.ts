import {
  Message,
  MessageType,
  OffscreenStartPayload,
  RecordingStoppedPayload,
} from "../shared/types";

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let mimeType = "audio/webm;codecs=opus";
let audioContext: AudioContext | null = null;
let tabStream: MediaStream | null = null;
let micStream: MediaStream | null = null;

async function startRecording(streamId: string): Promise<void> {
  try {
    // 1. Tab audio = remote participants (what you hear from others)
    tabStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-expect-error: Chrome-specific constraint
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    // 2. Microphone = local user (you speaking). Offscreen may lack user gesture — fallback to tab-only.
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (micErr) {
      console.warn("[Decker offscreen] Mic access failed, recording tab only:", micErr);
      micStream = null;
    }

    // 3. Build stream: tab + mic (if available)
    audioContext = new AudioContext();
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    const destination = audioContext.createMediaStreamDestination();
    tabSource.connect(destination);

    if (micStream) {
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
    }

    // Route tab to speakers so user still hears the meeting
    tabSource.connect(audioContext.destination);

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const mixedStream = destination.stream;

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];
    mimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";

    audioChunks = [];
    mediaRecorder = new MediaRecorder(mixedStream, {
      mimeType,
      audioBitsPerSecond: 128_000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: mimeType });
      console.log("[Decker offscreen] Recording stopped, blob size:", blob.size, "chunks:", audioChunks.length);

      if (audioContext) {
        await audioContext.close();
        audioContext = null;
      }
      tabStream?.getTracks().forEach((t) => t.stop());
      micStream?.getTracks().forEach((t) => t.stop());
      tabStream = null;
      micStream = null;

      if (blob.size < 1000) {
        console.error("[Decker offscreen] Recording too short or empty — need at least ~1KB of audio");
        chrome.runtime.sendMessage({
          type: MessageType.STATUS_UPDATE,
          payload: { status: "error", message: "Recording too short. Record at least 3–5 seconds of audio." },
        });
        return;
      }

      chrome.runtime.sendMessage({
        type: MessageType.STATUS_UPDATE,
        payload: { status: "finalizing", message: "Preparing audio…" },
      });

      console.log("[Decker offscreen] Converting blob to base64…");
      const base64 = await blobToBase64(blob);
      console.log("[Decker offscreen] Base64 ready, sending RECORDING_STOPPED to background…");

      chrome.runtime.sendMessage<Message<RecordingStoppedPayload>>({
        type: MessageType.RECORDING_STOPPED,
        payload: { base64, mimeType },
      });
    };

    mediaRecorder.start(2_000);
    console.log(
      "[Decker offscreen] MediaRecorder started",
      micStream ? "(tab + mic)" : "(tab only)",
      "mimeType:",
      mimeType
    );
  } catch (err) {
    console.error("[Decker offscreen] startRecording failed:", err);
    tabStream?.getTracks().forEach((t) => t.stop());
    micStream?.getTracks().forEach((t) => t.stop());
    tabStream = null;
    micStream = null;
    const name = err instanceof Error ? (err as DOMException).name ?? "" : "";
    const msg = err instanceof Error ? err.message : String(err);
    chrome.runtime.sendMessage({
      type: MessageType.STATUS_UPDATE,
      payload: {
        status: "error",
        message:
          name === "NotAllowedError"
            ? "Permission denied. Allow microphone and reload the Meet tab, then try again."
            : msg.includes("not found") || name === "NotFoundError"
              ? "Microphone not found. Check your device."
              : `Capture failed: ${msg}`,
      },
    });
  }
}

function stopRecording(): void {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  } else {
    console.warn("[Decker offscreen] stopRecording called but recorder not active");
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Message listener
chrome.runtime.onMessage.addListener((message: Message) => {
  switch (message.type) {
    case MessageType.OFFSCREEN_START: {
      const payload = message.payload as OffscreenStartPayload;
      startRecording(payload.streamId).catch(console.error);
      break;
    }

    case MessageType.OFFSCREEN_STOP: {
      console.log("[Decker offscreen] OFFSCREEN_STOP received, stopping MediaRecorder…");
      stopRecording();
      break;
    }
  }
});

console.log("[Decker offscreen] Document ready");
