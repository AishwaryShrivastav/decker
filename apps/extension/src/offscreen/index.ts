import {
  Message,
  MessageType,
  OffscreenStartPayload,
  RecordingStoppedPayload,
} from "../shared/types";

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let mimeType = "audio/webm;codecs=opus";

async function startRecording(streamId: string): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-expect-error: Chrome-specific constraint
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    // Pick supported mime type
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];
    mimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: mimeType });
      const base64 = await blobToBase64(blob);
      console.log("[Decker offscreen] Recording stopped, blob size:", blob.size);

      chrome.runtime.sendMessage<Message<RecordingStoppedPayload>>({
        type: MessageType.RECORDING_STOPPED,
        payload: { base64, mimeType },
      });

      // Stop all tracks to release microphone indicator
      stream.getTracks().forEach((t) => t.stop());
    };

    // Collect data every 10 seconds (memory management for long meetings)
    mediaRecorder.start(10_000);
    console.log("[Decker offscreen] MediaRecorder started, mimeType:", mimeType);
  } catch (err) {
    console.error("[Decker offscreen] startRecording failed:", err);
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
      stopRecording();
      break;
    }
  }
});

console.log("[Decker offscreen] Document ready");
