import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  OffscreenStartPayload,
  RecordingStoppedPayload,
  AudioChunkPayload,
  ApiSettings,
  GenerateDeckPayload,
  StartRecordingStreamPayload,
} from "../shared/types";
import { buildRevealHtml, DeckData } from "../shared/revealTemplate";
import { buildNotesHtml, NotesData } from "../shared/notesTemplate";
import {
  EXTRACT_POINTS_SYSTEM,
  extractPointsUser,
  DECK_SYSTEM,
  deckUser,
  NOTES_SYSTEM,
  notesUser,
} from "../shared/prompts";

const OPENAI_API_BASE = "https://api.openai.com/v1";

// --- State ---
let recordingTabId: number | null = null;
let currentStatus: RecordingStatus = "idle";
let currentTranscript: string | null = null;
let accumulatedTranscript = ""; // Built from live chunk transcriptions during recording
let chunkQueue: { base64: string; mimeType: string }[] = [];
let chunkProcessing = false;
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

// --- OpenAI helpers ---
const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/flac": "flac",
};

async function openaiTranscribe(audioBlob: Blob): Promise<string> {
  // Strip codec params: "audio/webm;codecs=opus" → "audio/webm"
  const baseMime = audioBlob.type.split(";")[0]?.trim() || "audio/webm";
  const ext = MIME_TO_EXT[baseMime] ?? "webm";
  const file = new File([audioBlob], `audio.${ext}`, { type: baseMime });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  const res = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { text: string };
  return typeof data.text === "string" ? data.text.trim() : "";
}

async function openaiChat(
  messages: { role: "system" | "user"; content: string }[],
  temperature = 0.4
): Promise<string> {
  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GPT-4o error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "{}";
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
  extra?: { transcript?: string; points?: string[]; liveNotes?: string }
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

// --- Chunk transcription (live meeting notes) ---
async function transcribeChunk(base64: string, mimeType: string): Promise<string> {
  const audioBytes = atob(base64);
  const audioBuffer = new Uint8Array(audioBytes.length);
  for (let i = 0; i < audioBytes.length; i++) {
    audioBuffer[i] = audioBytes.charCodeAt(i);
  }
  const audioBlob = new Blob([audioBuffer], { type: mimeType });
  return openaiTranscribe(audioBlob);
}

async function processChunkQueue(): Promise<void> {
  if (chunkProcessing || chunkQueue.length === 0) return;
  chunkProcessing = true;

  const chunk = chunkQueue.shift()!;
  try {
    const text = await transcribeChunk(chunk.base64, chunk.mimeType);
    if (text) {
      accumulatedTranscript = accumulatedTranscript ? `${accumulatedTranscript} ${text}` : text;
      debugLog(`Chunk transcribed (${text.length} chars), total: ${accumulatedTranscript.length}`);
      broadcastStatus("recording", undefined, {
        transcript: accumulatedTranscript,
        liveNotes: accumulatedTranscript,
      });
    }
  } catch (err) {
    debugLog(`Chunk transcribe FAILED: ${err instanceof Error ? err.message : String(err)}`);
    console.warn("[Decker background] Chunk transcription failed:", err);
  } finally {
    chunkProcessing = false;
    if (chunkQueue.length > 0) processChunkQueue().catch(console.error);
  }
}

// --- Recording pipeline ---
async function startRecordingWithStream(tabId: number, streamId: string): Promise<void> {
  recordingTabId = tabId;
  currentTranscript = null;
  accumulatedTranscript = "";
  chunkQueue = [];
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

// Phase 1: transcribe audio → extract points → broadcast "reviewing"
async function runPhase1(base64Audio: string, mimeType: string): Promise<void> {
  try {
    // Wait for any in-flight chunk transcriptions to finish
    debugLog("runPhase1: waiting for chunk queue to drain…");
    while (chunkQueue.length > 0 || chunkProcessing) {
      await new Promise((r) => setTimeout(r, 300));
    }
    debugLog(`runPhase1: queue drained, accumulated: ${accumulatedTranscript.length} chars`);

    let transcript = accumulatedTranscript;

    // Transcribe the final blob if we have remaining audio
    if (base64Audio && base64Audio.length >= 100) {
      const audioBytes = atob(base64Audio);
      const audioBuffer = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) {
        audioBuffer[i] = audioBytes.charCodeAt(i);
      }
      const audioBlob = new Blob([audioBuffer], { type: mimeType });

      if (audioBlob.size >= 1000) {
        broadcastStatus("transcribing", "Transcribing final segment…");
        debugLog("Transcribing final recording segment…");

        const seg = await openaiTranscribe(audioBlob);
        if (seg) transcript = transcript ? `${transcript} ${seg}` : seg;
      }
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcription returned empty text. Was audio captured correctly? Try recording longer.");
    }
    currentTranscript = transcript;
    console.log("[Decker background] Final transcript length:", transcript.length);

    // Extract discussion points
    broadcastStatus("extracting", "Extracting discussion points…");
    console.log("[Decker background] Extracting discussion points…");

    const extractRaw = await openaiChat(
      [
        { role: "system", content: EXTRACT_POINTS_SYSTEM },
        { role: "user", content: extractPointsUser(transcript) },
      ],
      0.3
    );

    const parsedExtract = JSON.parse(extractRaw) as { points?: unknown };
    const points = Array.isArray(parsedExtract.points)
      ? (parsedExtract.points as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 12)
      : [];

    console.log("[Decker background] Extracted", points.length, "points");

    // Phase 1 complete — let user review
    broadcastStatus("reviewing", undefined, { transcript, points });
    await closeOffscreenDocument();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
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
  backgroundColor?: string,
  outputFormat?: "presentation" | "notes"
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

  const isNotes = outputFormat === "notes";

  try {
    broadcastStatus("generating", isNotes ? "Generating notes…" : "Generating presentation…");

    let html: string;

    if (isNotes) {
      let rawJson = await openaiChat([
        { role: "system", content: NOTES_SYSTEM },
        { role: "user", content: notesUser(transcript, selectedPoints, customPrompt) },
      ]);
      rawJson = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

      const parsedObj = JSON.parse(rawJson) as Record<string, unknown>;
      const sectionsRaw = Array.isArray(parsedObj.sections) ? parsedObj.sections : [];
      const validSections = sectionsRaw
        .slice(0, 8)
        .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
        .map((s) => {
          const chart = s.chart as Record<string, unknown> | undefined;
          const validChart =
            chart &&
            typeof chart === "object" &&
            Array.isArray(chart.labels) &&
            Array.isArray(chart.values) &&
            chart.labels.length === chart.values.length
              ? {
                  type: (["bar", "pie", "line", "doughnut"].includes(String(chart.type))
                    ? (chart.type as "bar" | "pie" | "line" | "doughnut")
                    : "bar") as "bar" | "pie" | "line" | "doughnut",
                  title: typeof chart.title === "string" ? chart.title : undefined,
                  labels: (chart.labels as unknown[]).filter((l): l is string => typeof l === "string").slice(0, 12),
                  values: (chart.values as unknown[]).filter((v): v is number => typeof v === "number" && !Number.isNaN(v)).slice(0, 12),
                }
              : undefined;
          const mermaid = typeof s.mermaid === "string" && s.mermaid.trim() ? s.mermaid.trim().slice(0, 2000) : undefined;
          return {
            heading: typeof s.heading === "string" ? s.heading : "Section",
            items: Array.isArray(s.items)
              ? (s.items as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 12)
              : [],
            chart: validChart,
            mermaid,
          };
        })
        .filter((s) => s.items.length > 0 || s.chart || s.mermaid);

      const notesData: NotesData = {
        title: typeof parsedObj.title === "string" ? parsedObj.title : "Meeting Notes",
        subtitle: typeof parsedObj.subtitle === "string" ? parsedObj.subtitle : undefined,
        sections: validSections.length >= 1 ? validSections : [{ heading: "Summary", items: ["Add content from transcript"] }],
      };

      html = buildNotesHtml(notesData);
    } else {
      // Presentation (Reveal.js)
      const bgColor = (() => {
        let c = backgroundColor?.trim().toLowerCase();
        if (!c && /green\s*(background|theme|slide)/i.test(customPrompt)) c = "green";
        if (!c && /blue\s*(background|theme|slide)/i.test(customPrompt)) c = "blue";
        if (!c && /light\s*(background|theme|slide)/i.test(customPrompt)) c = "light";
        return c;
      })();

      let rawJson = await openaiChat([
        { role: "system", content: DECK_SYSTEM },
        { role: "user", content: deckUser(transcript, selectedPoints, customPrompt) },
      ]);
      rawJson = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

      const parsedObj = JSON.parse(rawJson) as Record<string, unknown>;
      const slides = Array.isArray(parsedObj.slides) ? parsedObj.slides : [];
      const validSlides = slides
        .slice(0, 12)
        .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
        .map((s) => {
          const chart = s.chart as Record<string, unknown> | undefined;
          const validChart =
            chart &&
            typeof chart === "object" &&
            Array.isArray(chart.labels) &&
            Array.isArray(chart.values) &&
            chart.labels.length === chart.values.length
              ? {
                  type: (["bar", "pie", "line", "doughnut"].includes(String(chart.type))
                    ? (chart.type as "bar" | "pie" | "line" | "doughnut")
                    : "bar") as "bar" | "pie" | "line" | "doughnut",
                  title: typeof chart.title === "string" ? chart.title : undefined,
                  labels: (chart.labels as unknown[]).filter((l): l is string => typeof l === "string").slice(0, 12),
                  values: (chart.values as unknown[]).filter((v): v is number => typeof v === "number" && !Number.isNaN(v)).slice(0, 12),
                }
              : undefined;
          const mermaid = typeof s.mermaid === "string" && s.mermaid.trim() ? s.mermaid.trim().slice(0, 2000) : undefined;
          return {
            title: typeof s.title === "string" ? s.title : "Slide",
            bullets: Array.isArray(s.bullets)
              ? (s.bullets as unknown[]).filter((b): b is string => typeof b === "string").slice(0, 10)
              : [],
            notes: typeof s.notes === "string" ? s.notes : undefined,
            chart: validChart,
            mermaid,
          };
        });

      const deckData: DeckData = {
        title: typeof parsedObj.title === "string" ? parsedObj.title : "Presentation",
        subtitle: typeof parsedObj.subtitle === "string" ? parsedObj.subtitle : undefined,
        slides:
          validSlides.length >= 3
            ? validSlides
            : validSlides.concat(
                Array.from({ length: Math.max(0, 3 - validSlides.length) }, (_, i) => ({
                  title: `Slide ${validSlides.length + i + 1}`,
                  bullets: ["Add content from transcript"],
                  notes: undefined as string | undefined,
                }))
              ),
      };

      html = buildRevealHtml(deckData, bgColor);
    }

    lastGeneratedHtml = html;

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    const filename = isNotes ? `decker-notes-${Date.now()}.html` : `decker-deck-${Date.now()}.html`;

    await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
    });

    broadcastStatus("done", `${isNotes ? "Notes" : "Deck"} saved as ${filename}`);
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
        sendResponse({ error: "Use START_RECORDING_WITH_STREAM from popup" });
        return false;
      }

      case MessageType.STOP_RECORDING: {
        stopRecording().catch(console.error);
        sendResponse({ ok: true });
        return false;
      }

      case MessageType.AUDIO_CHUNK: {
        const payload = msg.payload as AudioChunkPayload;
        if (payload?.base64 && payload?.mimeType) {
          chunkQueue.push({ base64: payload.base64, mimeType: payload.mimeType });
          debugLog(`AUDIO_CHUNK received, queue size: ${chunkQueue.length}`);
          processChunkQueue().catch(console.error);
        } else {
          console.warn("[Decker background] AUDIO_CHUNK missing base64 or mimeType", !!payload?.base64, !!payload?.mimeType);
        }
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
          payload.backgroundColor,
          payload.outputFormat
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
