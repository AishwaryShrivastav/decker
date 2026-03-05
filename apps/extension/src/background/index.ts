import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  OffscreenStartPayload,
  RecordingStoppedPayload,
  ApiSettings,
  GenerateDeckPayload,
} from "../shared/types";
import { API_BASE_URL } from "../shared/constants";

// --- State ---
let recordingTabId: number | null = null;
let currentStatus: RecordingStatus = "idle";
let currentTranscript: string | null = null;
let apiKey = "";

// Load API key from storage on startup
chrome.storage.local.get("apiKey", (result) => {
  if (result.apiKey) apiKey = result.apiKey as string;
});

// --- Helpers ---
function isClaudeKey(key: string): boolean {
  return key.startsWith("sk-ant-");
}

function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  return headers;
}

// --- Offscreen document management ---
async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("src/offscreen/index.html"),
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: "Recording tab audio via MediaRecorder",
  });
}

async function closeOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length === 0) return;
  await chrome.offscreen.closeDocument();
}

// --- Status broadcasting ---
function broadcastStatus(
  status: RecordingStatus,
  message?: string,
  extra?: { transcript?: string; points?: string[] }
): void {
  currentStatus = status;
  const payload: StatusPayload = { status, message, ...extra };
  chrome.runtime
    .sendMessage<Message<StatusPayload>>({
      type: MessageType.STATUS_UPDATE,
      payload,
    })
    .catch(() => {
      // Popup may not be open — ignore
    });

  if (recordingTabId !== null) {
    chrome.tabs
      .sendMessage<Message<StatusPayload>>(recordingTabId, {
        type: MessageType.STATUS_UPDATE,
        payload,
      })
      .catch(() => {
        // Tab may have navigated away — ignore
      });
  }
}

// --- Recording pipeline ---
async function startRecording(tabId: number): Promise<void> {
  recordingTabId = tabId;
  currentTranscript = null;
  broadcastStatus("recording");

  try {
    const streamId = await new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(id);
        }
      });
    });

    await ensureOffscreenDocument();

    await chrome.runtime.sendMessage<Message<OffscreenStartPayload>>({
      type: MessageType.OFFSCREEN_START,
      payload: { streamId },
    });
  } catch (err) {
    console.error("[Decker background] startRecording failed:", err);
    broadcastStatus("error", String(err));
    await closeOffscreenDocument();
  }
}

async function stopRecording(): Promise<void> {
  broadcastStatus("processing");
  try {
    await chrome.runtime.sendMessage<Message>({
      type: MessageType.OFFSCREEN_STOP,
    });
  } catch (err) {
    console.error("[Decker background] stopRecording failed:", err);
    broadcastStatus("error", String(err));
  }
}

// Phase 1: transcribe → extract points → broadcast "reviewing"
async function runPhase1(base64Audio: string, mimeType: string): Promise<void> {
  try {
    // Step 1: Transcribe
    broadcastStatus("transcribing", "Transcribing audio…");
    console.log("[Decker background] Starting transcription, audio size:", base64Audio.length);

    const audioBytes = atob(base64Audio);
    const audioBuffer = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      audioBuffer[i] = audioBytes.charCodeAt(i);
    }
    const audioBlob = new Blob([audioBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const transcribeHeaders: Record<string, string> = {};
    if (apiKey) transcribeHeaders["X-Api-Key"] = apiKey;

    const transcribeRes = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: "POST",
      headers: transcribeHeaders,
      body: formData,
    });

    if (!transcribeRes.ok) {
      const errText = await transcribeRes.text();
      throw new Error(`Transcription failed: ${transcribeRes.status} ${errText}`);
    }

    const { transcript } = (await transcribeRes.json()) as { transcript: string };
    currentTranscript = transcript;
    console.log("[Decker background] Transcript length:", transcript.length);

    // Step 2: Extract discussion points
    broadcastStatus("extracting", "Extracting discussion points…");

    const extractRes = await fetch(`${API_BASE_URL}/api/extract-points`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ transcript }),
    });

    if (!extractRes.ok) {
      const errText = await extractRes.text();
      throw new Error(`Point extraction failed: ${extractRes.status} ${errText}`);
    }

    const { points } = (await extractRes.json()) as { points: string[] };
    console.log("[Decker background] Extracted", points.length, "points");

    // Phase 1 complete — let user review
    broadcastStatus("reviewing", undefined, { transcript, points });
    await closeOffscreenDocument();
  } catch (err) {
    console.error("[Decker background] runPhase1 failed:", err);
    broadcastStatus("error", String(err));
    await closeOffscreenDocument();
  }
}

// Phase 2: generate deck from selected points + custom prompt
async function runPhase2(selectedPoints: string[], customPrompt: string): Promise<void> {
  if (!currentTranscript) {
    broadcastStatus("error", "No transcript available — please record again");
    return;
  }

  try {
    broadcastStatus("generating", "Generating presentation…");

    const generateRes = await fetch(`${API_BASE_URL}/api/generate-deck`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        transcript: currentTranscript,
        selectedPoints,
        customPrompt,
      }),
    });

    if (!generateRes.ok) {
      const errText = await generateRes.text();
      throw new Error(`Deck generation failed: ${generateRes.status} ${errText}`);
    }

    const { html } = (await generateRes.json()) as { html: string };

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    const filename = `decker-deck-${Date.now()}.html`;

    await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
    });

    broadcastStatus("done", `Deck saved as ${filename}`);
  } catch (err) {
    console.error("[Decker background] runPhase2 failed:", err);
    broadcastStatus("error", String(err));
  }
}

// --- Message listener ---
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    const msg = message as Message;

    switch (msg.type) {
      case MessageType.GET_TAB_ID: {
        sendResponse({ tabId: sender.tab?.id ?? null });
        return false;
      }

      case MessageType.GET_STATUS: {
        sendResponse({ status: currentStatus });
        return false;
      }

      case MessageType.GET_API_SETTINGS: {
        sendResponse({ apiKey });
        return false;
      }

      case MessageType.SET_API_SETTINGS: {
        const settings = msg.payload as ApiSettings;
        apiKey = settings.apiKey ?? "";
        chrome.storage.local.set({ apiKey });
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.START_RECORDING: {
        const tabId = sender.tab?.id;
        if (tabId == null) {
          sendResponse({ error: "No tab ID" });
          return false;
        }
        startRecording(tabId).catch(console.error);
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.STOP_RECORDING: {
        stopRecording().catch(console.error);
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.RECORDING_STOPPED: {
        const payload = msg.payload as RecordingStoppedPayload;
        runPhase1(payload.base64, payload.mimeType).catch(console.error);
        return false;
      }

      case MessageType.GENERATE_DECK: {
        const payload = msg.payload as GenerateDeckPayload;
        runPhase2(payload.selectedPoints, payload.customPrompt).catch(console.error);
        sendResponse({ ok: true });
        return false;
      }

      default:
        return false;
    }
  }
);

console.log("[Decker background] Service worker started");
