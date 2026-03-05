import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  OffscreenStartPayload,
  RecordingStoppedPayload,
  ApiSettings,
  GenerateDeckPayload,
  StartRecordingStreamPayload,
} from "../shared/types";
import { API_BASE_URL } from "../shared/constants";

// --- State ---
let recordingTabId: number | null = null;
let currentStatus: RecordingStatus = "idle";
let currentTranscript: string | null = null;
let apiKey = "";
let lastGeneratedHtml: string | null = null;

const DEBUG_LOG_KEY = "deckerDebugLog";
const MAX_DEBUG_ENTRIES = 15;

async function debugLog(msg: string): Promise<void> {
  const entry = `[${new Date().toISOString().slice(11, 23)}] ${msg}`;
  console.log("[Decker]", msg);
  chrome.storage.local.get(DEBUG_LOG_KEY, (r) => {
    const log = (r[DEBUG_LOG_KEY] as string[]) ?? [];
    log.push(entry);
    chrome.storage.local.set({ [DEBUG_LOG_KEY]: log.slice(-MAX_DEBUG_ENTRIES) });
  });
}

// Load API key from storage on startup
chrome.storage.local.get("apiKey", (result) => {
  if (result.apiKey) apiKey = result.apiKey as string;
});

// --- Helpers ---
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
// Called with a stream ID that was obtained by the popup (which has invocation rights)
async function startRecordingWithStream(tabId: number, streamId: string): Promise<void> {
  recordingTabId = tabId;
  currentTranscript = null;
  broadcastStatus("recording");

  try {
    await ensureOffscreenDocument();

    await chrome.runtime.sendMessage<Message<OffscreenStartPayload>>({
      type: MessageType.OFFSCREEN_START,
      payload: { streamId },
    });
  } catch (err) {
    console.error("[Decker background] startRecordingWithStream failed:", err);
    broadcastStatus("error", String(err));
    await closeOffscreenDocument();
  }
}

async function stopRecording(): Promise<void> {
  const hasOffscreen = (
    await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    })
  ).length > 0;

  if (!hasOffscreen) {
    debugLog("Stop requested but no offscreen doc — recording already ended or extension was reloaded");
    currentStatus = "idle";
    broadcastStatus("idle");
    await closeOffscreenDocument();
    return;
  }

  debugLog("STOP_RECORDING received → sending OFFSCREEN_STOP");
  broadcastStatus("processing");
  try {
    await chrome.runtime.sendMessage<Message>({
      type: MessageType.OFFSCREEN_STOP,
    });
    debugLog("OFFSCREEN_STOP sent, waiting for RECORDING_STOPPED…");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Receiving end does not exist") || msg.includes("Extension context invalidated")) {
      debugLog("Offscreen doc gone (reload/close) — resetting to idle");
      recordingTabId = null;
      currentStatus = "idle";
      broadcastStatus("idle");
      await closeOffscreenDocument();
    } else {
      console.error("[Decker background] stopRecording failed:", err);
      broadcastStatus("error", msg);
    }
  }
}

// Phase 1: transcribe → extract points → broadcast "reviewing"
async function runPhase1(base64Audio: string, mimeType: string): Promise<void> {
  try {
    if (!base64Audio || base64Audio.length < 100) {
      throw new Error("Recording too short. Record at least 3–5 seconds of audio.");
    }

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

    debugLog("Calling /api/transcribe…");
    const transcribeRes = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: "POST",
      headers: apiKey ? { "X-Api-Key": apiKey } : {},
      body: formData,
    });
    debugLog(`Transcribe response: ${transcribeRes.status} ${transcribeRes.statusText}`);

    if (!transcribeRes.ok) {
      const errText = await transcribeRes.text();
      throw new Error(`Transcription failed: ${transcribeRes.status} ${errText}`);
    }

    const { transcript } = (await transcribeRes.json()) as { transcript: string };
    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      throw new Error("Transcription returned empty text. Was audio captured correctly? Try recording longer.");
    }
    currentTranscript = transcript;
    console.log("[Decker background] Transcript length:", transcript.length);

    // Step 2: Extract discussion points
    broadcastStatus("extracting", "Extracting discussion points…");
    console.log("[Decker background] Calling /api/extract-points…");

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
    const raw = err instanceof Error ? err.message : String(err);
    const msg =
      raw === "Failed to fetch" || raw.includes("Failed to fetch")
        ? "API unreachable. Is the web server running? Run: pnpm --filter web dev (then open http://localhost:3000)"
        : raw;
    debugLog(`runPhase1 FAILED: ${msg}`);
    broadcastStatus("error", msg);
    await closeOffscreenDocument();
  }
}

// Phase 2: generate deck from selected points + custom prompt
async function runPhase2(
  selectedPoints: string[],
  customPrompt: string,
  transcriptOverride?: string,
  backgroundColor?: string
): Promise<void> {
  const transcript = transcriptOverride?.trim() || currentTranscript?.trim();
  if (!transcript) {
    broadcastStatus("error", "No transcript available — please record again or paste your transcript");
    return;
  }
  if (transcript.length < 50) {
    broadcastStatus("error", "Transcript needs at least 50 characters to generate a deck");
    return;
  }

  try {
    broadcastStatus("generating", "Generating presentation…");

    const generateRes = await fetch(`${API_BASE_URL}/api/generate-deck`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        transcript,
        selectedPoints,
        customPrompt,
        backgroundColor: backgroundColor || undefined,
      }),
    });

    if (!generateRes.ok) {
      const errText = await generateRes.text();
      throw new Error(`Deck generation failed: ${generateRes.status} ${errText}`);
    }

    const { html } = (await generateRes.json()) as { html: string };
    lastGeneratedHtml = html;

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
    const msg = err instanceof Error ? err.message : String(err);
    broadcastStatus("error", msg);
  }
}

// --- Message listener ---
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    const msg = message as Message;
    console.log("[Decker background] Message received:", msg.type);

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

      case MessageType.GET_DEBUG_LOG: {
        chrome.storage.local.get(DEBUG_LOG_KEY, (r) => {
          try {
            sendResponse({ log: (r[DEBUG_LOG_KEY] as string[]) ?? [] });
          } catch {
            // sendResponse may fail if listener already returned
          }
        });
        return true; // async response
      }

      case MessageType.SET_API_SETTINGS: {
        const settings = msg.payload as ApiSettings;
        apiKey = settings.apiKey ?? "";
        chrome.storage.local.set({ apiKey });
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.START_RECORDING_WITH_STREAM: {
        const payload = msg.payload as StartRecordingStreamPayload;
        debugLog("START_RECORDING received, starting…");
        startRecordingWithStream(payload.tabId, payload.streamId).catch(console.error);
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.START_RECORDING: {
        // Legacy path — recording now started from popup via START_RECORDING_WITH_STREAM
        sendResponse({ error: "Use START_RECORDING_WITH_STREAM from popup" });
        return false;
      }

      case MessageType.STOP_RECORDING: {
        stopRecording().catch(console.error);
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.RECORDING_STOPPED: {
        const payload = msg.payload as RecordingStoppedPayload;
        debugLog(`RECORDING_STOPPED received, audio ${payload.base64?.length ?? 0} chars`);
        runPhase1(payload.base64, payload.mimeType).catch(console.error);
        return false;
      }

      case MessageType.GENERATE_DECK: {
        const payload = msg.payload as GenerateDeckPayload;
        runPhase2(
          payload.selectedPoints,
          payload.customPrompt,
          payload.transcript,
          payload.backgroundColor
        ).catch(console.error);
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.GET_LAST_HTML: {
        sendResponse({ html: lastGeneratedHtml });
        return false;
      }

      case MessageType.STATUS_UPDATE: {
        const payload = msg.payload as StatusPayload;
        if (payload) {
          if (payload.status === "error") debugLog(`Error from offscreen: ${payload.message ?? "unknown"}`);
          broadcastStatus(payload.status, payload.message);
        }
        return false;
      }

      default:
        return false;
    }
  }
);

console.log("[Decker background] Service worker started");
