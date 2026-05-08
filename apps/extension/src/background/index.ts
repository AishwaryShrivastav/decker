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
  TopicResearch,
  TopicSelectedPayload,
  FullStateResponse,
} from "../shared/types";
import { buildRevealHtml, DeckData } from "../shared/revealTemplate";
import { buildNotesHtml, NotesData } from "../shared/notesTemplate";
import { buildMeetingDoc, MeetingDocData, DocTopic } from "../shared/docTemplate";
import {
  EXTRACT_POINTS_SYSTEM,
  extractPointsUser,
  RESEARCH_SYSTEM,
  researchUser,
  DOC_SYSTEM,
  docUser,
  PROTOTYPE_SYSTEM,
  prototypeUser,
  DECK_SYSTEM,
  deckUser,
  NOTES_SYSTEM,
  notesUser,
} from "../shared/prompts";

const OPENAI_API_BASE = "https://api.openai.com/v1";
const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";
const CLAUDE_HAIKU = "claude-haiku-4-5-20251001";
const CLAUDE_SONNET = "claude-sonnet-4-6";

// --- State ---
let recordingTabId: number | null = null;
let currentStatus: RecordingStatus = "idle";
let currentTranscript: string | null = null;
let accumulatedTranscript = "";
let chunkQueue: { base64: string; mimeType: string }[] = [];
let chunkProcessing = false;
let chunkTranscribedCount = 0;
let isExtractingTopics = false;
let claudeKey = "";   // Anthropic key — text generation + research
let openaiKey = "";   // OpenAI key — Whisper transcription
let lastGeneratedHtml: string | null = null;

// Live topic + research state
let liveTopics: string[] = [];
const topicResearchMap = new Map<string, TopicResearch>();
const researchInProgress = new Set<string>();

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

chrome.storage.local.get(["claudeKey", "openaiKey"], (result) => {
  if (result.claudeKey) claudeKey = result.claudeKey as string;
  if (result.openaiKey) openaiKey = result.openaiKey as string;
});

// ---------------------------------------------------------------------------
// Whisper (OpenAI) — audio transcription
// ---------------------------------------------------------------------------
const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/flac": "flac",
};

async function openaiTranscribe(audioBlob: Blob): Promise<string> {
  const baseMime = audioBlob.type.split(";")[0]?.trim() || "audio/webm";
  const ext = MIME_TO_EXT[baseMime] ?? "webm";
  const file = new File([audioBlob], `audio.${ext}`, { type: baseMime });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  if (!openaiKey) throw new Error("No OpenAI key set — add it in Decker settings (⚙) for Whisper transcription.");
  const res = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { text: string };
  return typeof data.text === "string" ? data.text.trim() : "";
}

// ---------------------------------------------------------------------------
// Claude helpers
// ---------------------------------------------------------------------------

/**
 * Non-streaming Claude call — for topic extraction and research.
 * Uses Haiku by default (fast + cheap for structured extraction).
 */
async function claudeComplete(
  systemPrompt: string,
  userMessage: string,
  model: "haiku" | "sonnet" = "haiku"
): Promise<string> {
  if (!claudeKey) throw new Error("No Claude key set — add it in Decker settings (⚙).");
  const modelId = model === "haiku" ? CLAUDE_HAIKU : CLAUDE_SONNET;

  const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude ${model} error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { content: { type: string; text: string }[] };
  return data.content.find((c) => c.type === "text")?.text ?? "{}";
}

/**
 * Streaming Claude call — for final doc/deck generation.
 * Uses Sonnet by default. Calls onProgress every ~100 tokens.
 */
async function claudeStream(
  systemPrompt: string,
  userMessage: string,
  model: "haiku" | "sonnet" = "sonnet",
  onProgress?: (tokenCount: number) => void
): Promise<string> {
  if (!claudeKey) throw new Error("No Claude key set — add it in Decker settings (⚙).");
  const modelId = model === "haiku" ? CLAUDE_HAIKU : CLAUDE_SONNET;

  const res = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 8192,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude ${model} stream error ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let tokenCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const event = JSON.parse(data) as {
            type: string;
            delta?: { type: string; text?: string };
          };
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta" &&
            event.delta.text
          ) {
            fullText += event.delta.text;
            tokenCount++;
            if (tokenCount % 100 === 0) onProgress?.(tokenCount);
          }
        } catch {
          // ignore individual SSE parse errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

// ---------------------------------------------------------------------------
// Offscreen document management
// ---------------------------------------------------------------------------
async function ensureOffscreenDocument(): Promise<void> {
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existing.length > 0) return;
  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("src/offscreen/index.html"),
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: "Recording tab audio via MediaRecorder",
  });
}

async function closeOffscreenDocument(): Promise<void> {
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existing.length === 0) return;
  await chrome.offscreen.closeDocument();
}

// ---------------------------------------------------------------------------
// Status broadcasting
// ---------------------------------------------------------------------------
function broadcastStatus(
  status: RecordingStatus,
  message?: string,
  extra?: {
    transcript?: string;
    points?: string[];
    liveNotes?: string;
    topicResearch?: TopicResearch[];
    streamText?: string;
  }
): void {
  currentStatus = status;
  const payload: StatusPayload = { status, message, ...extra };
  chrome.runtime
    .sendMessage<Message<StatusPayload>>({ type: MessageType.STATUS_UPDATE, payload })
    .catch(() => {});

  if (recordingTabId !== null) {
    chrome.tabs
      .sendMessage<Message<StatusPayload>>(recordingTabId, {
        type: MessageType.STATUS_UPDATE,
        payload,
      })
      .catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Broadcast helper: push current research map to popup
// ---------------------------------------------------------------------------
function broadcastResearchUpdate(): void {
  broadcastStatus(currentStatus, undefined, {
    topicResearch: Array.from(topicResearchMap.values()),
  });
}

// ---------------------------------------------------------------------------
// Live topic extraction (called every 3 transcribed chunks)
// ---------------------------------------------------------------------------
async function updateLiveTopics(): Promise<void> {
  if (isExtractingTopics || accumulatedTranscript.length < 100) return;
  isExtractingTopics = true;
  try {
    const raw = await claudeComplete(EXTRACT_POINTS_SYSTEM, extractPointsUser(accumulatedTranscript));
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { points?: unknown };
    const newPoints = Array.isArray(parsed.points)
      ? (parsed.points as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 12)
      : [];

    if (newPoints.length > 0) {
      liveTopics = newPoints;
      debugLog(`Live topics updated: ${newPoints.length} topics`);
      broadcastStatus("recording", undefined, {
        transcript: accumulatedTranscript,
        points: liveTopics,
        topicResearch: Array.from(topicResearchMap.values()),
      });
    }
  } catch (err) {
    debugLog(`Live topic extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    isExtractingTopics = false;
  }
}

// ---------------------------------------------------------------------------
// Per-topic background research
// ---------------------------------------------------------------------------
async function startTopicResearch(topic: string): Promise<void> {
  if (researchInProgress.has(topic)) return;
  researchInProgress.add(topic);

  // Mark as in-progress
  topicResearchMap.set(topic, { topic, status: "researching" });
  broadcastResearchUpdate();

  const transcript = accumulatedTranscript || currentTranscript || "";

  try {
    const raw = await claudeComplete(RESEARCH_SYSTEM, researchUser(topic, transcript));
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as {
      context?: string;
      keyInsight?: string;
      subtopics?: string[];
    };

    topicResearchMap.set(topic, {
      topic,
      status: "done",
      summary: typeof parsed.context === "string" ? parsed.context : undefined,
      keyInsight: typeof parsed.keyInsight === "string" ? parsed.keyInsight : undefined,
      subtopics: Array.isArray(parsed.subtopics)
        ? (parsed.subtopics as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 5)
        : [],
    });

    debugLog(`Research done for: "${topic}"`);
  } catch (err) {
    debugLog(`Research failed for "${topic}": ${err instanceof Error ? err.message : String(err)}`);
    topicResearchMap.set(topic, { topic, status: "error" });
  } finally {
    researchInProgress.delete(topic);
  }

  broadcastResearchUpdate();
}

// ---------------------------------------------------------------------------
// Chunk transcription pipeline
// ---------------------------------------------------------------------------
async function transcribeChunk(base64: string, mimeType: string): Promise<string> {
  const audioBytes = atob(base64);
  const buf = new Uint8Array(audioBytes.length);
  for (let i = 0; i < audioBytes.length; i++) buf[i] = audioBytes.charCodeAt(i);
  const blob = new Blob([buf], { type: mimeType });
  return openaiTranscribe(blob);
}

async function processChunkQueue(): Promise<void> {
  if (chunkProcessing || chunkQueue.length === 0) return;
  chunkProcessing = true;

  const chunk = chunkQueue.shift()!;
  try {
    const text = await transcribeChunk(chunk.base64, chunk.mimeType);
    if (text) {
      accumulatedTranscript = accumulatedTranscript ? `${accumulatedTranscript} ${text}` : text;
      chunkTranscribedCount++;
      debugLog(`Chunk ${chunkTranscribedCount} transcribed (${text.length} chars), total: ${accumulatedTranscript.length}`);

      // Extract topics every 3 chunks
      if (chunkTranscribedCount % 3 === 0) {
        updateLiveTopics().catch(console.error);
      }

      broadcastStatus("recording", undefined, {
        transcript: accumulatedTranscript,
        points: liveTopics.length > 0 ? liveTopics : undefined,
        topicResearch: Array.from(topicResearchMap.values()),
      });
    }
  } catch (err) {
    debugLog(`Chunk transcribe FAILED: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    chunkProcessing = false;
    if (chunkQueue.length > 0) processChunkQueue().catch(console.error);
  }
}

// ---------------------------------------------------------------------------
// Recording pipeline
// ---------------------------------------------------------------------------
async function startRecordingWithStream(tabId: number, streamId: string): Promise<void> {
  recordingTabId = tabId;
  currentTranscript = null;
  accumulatedTranscript = "";
  chunkQueue = [];
  chunkTranscribedCount = 0;
  liveTopics = [];
  topicResearchMap.clear();
  researchInProgress.clear();
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
  const hasOffscreen =
    (
      await chrome.runtime.getContexts({
        contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      })
    ).length > 0;

  if (!hasOffscreen) {
    debugLog("Stop requested but no offscreen doc");
    currentStatus = "idle";
    broadcastStatus("idle");
    await closeOffscreenDocument();
    return;
  }

  debugLog("STOP_RECORDING → sending OFFSCREEN_STOP");
  broadcastStatus("processing");
  try {
    await chrome.runtime.sendMessage<Message>({ type: MessageType.OFFSCREEN_STOP });
    debugLog("OFFSCREEN_STOP sent, waiting for RECORDING_STOPPED…");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Receiving end does not exist") || msg.includes("Extension context invalidated")) {
      debugLog("Offscreen doc gone — resetting to idle");
      recordingTabId = null;
      currentStatus = "idle";
      broadcastStatus("idle");
      await closeOffscreenDocument();
    } else {
      broadcastStatus("error", msg);
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 1: transcribe final audio → extract topics → reviewing
// ---------------------------------------------------------------------------
async function runPhase1(base64Audio: string, mimeType: string): Promise<void> {
  try {
    // Wait for chunk queue to drain
    debugLog("runPhase1: draining chunk queue…");
    while (chunkQueue.length > 0 || chunkProcessing) {
      await new Promise((r) => setTimeout(r, 300));
    }
    debugLog(`runPhase1: drained, accumulated: ${accumulatedTranscript.length} chars`);

    let transcript = accumulatedTranscript;

    // Transcribe final audio segment
    if (base64Audio && base64Audio.length >= 100) {
      const audioBytes = atob(base64Audio);
      const buf = new Uint8Array(audioBytes.length);
      for (let i = 0; i < audioBytes.length; i++) buf[i] = audioBytes.charCodeAt(i);
      const blob = new Blob([buf], { type: mimeType });

      if (blob.size >= 1000) {
        broadcastStatus("transcribing", "Transcribing final audio…");
        const seg = await openaiTranscribe(blob);
        if (seg) transcript = transcript ? `${transcript} ${seg}` : seg;
      }
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcription returned empty text. Was audio captured correctly?");
    }
    currentTranscript = transcript;

    // Final topic extraction (using accumulated live topics or re-extract)
    broadcastStatus("extracting", "Extracting discussion topics…");
    const raw = await claudeComplete(EXTRACT_POINTS_SYSTEM, extractPointsUser(transcript));
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { points?: unknown };
    const points = Array.isArray(parsed.points)
      ? (parsed.points as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 12)
      : liveTopics; // fallback to live topics

    liveTopics = points.length > 0 ? points : liveTopics;
    debugLog(`Phase 1 complete: ${liveTopics.length} topics, transcript ${transcript.length} chars`);

    // Kick off background research for any previously selected topics
    for (const [topic] of topicResearchMap) {
      if (topicResearchMap.get(topic)?.status === "pending") {
        startTopicResearch(topic).catch(console.error);
      }
    }

    broadcastStatus("reviewing", undefined, {
      transcript,
      points: liveTopics,
      topicResearch: Array.from(topicResearchMap.values()),
    });
    await closeOffscreenDocument();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    debugLog(`runPhase1 FAILED: ${msg}`);
    broadcastStatus("error", msg);
    await closeOffscreenDocument();
  }
}

// ---------------------------------------------------------------------------
// Validate + parse JSON output helpers (shared)
// ---------------------------------------------------------------------------
function parseJsonResponse(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function validChart(
  chart: unknown
): { type: "bar" | "pie" | "line" | "doughnut"; title?: string; labels: string[]; values: number[] } | undefined {
  if (!chart || typeof chart !== "object") return undefined;
  const c = chart as Record<string, unknown>;
  if (!Array.isArray(c.labels) || !Array.isArray(c.values)) return undefined;
  if (c.labels.length !== c.values.length || c.labels.length === 0) return undefined;
  const type = ["bar", "pie", "line", "doughnut"].includes(String(c.type))
    ? (c.type as "bar" | "pie" | "line" | "doughnut")
    : "bar";
  return {
    type,
    title: typeof c.title === "string" ? c.title : undefined,
    labels: (c.labels as unknown[]).filter((l): l is string => typeof l === "string").slice(0, 12),
    values: (c.values as unknown[]).filter((v): v is number => typeof v === "number" && !isNaN(v)).slice(0, 12),
  };
}

// ---------------------------------------------------------------------------
// Phase 2: research selected topics → generate document/deck
// ---------------------------------------------------------------------------
async function runPhase2(
  selectedPoints: string[],
  customPrompt: string,
  transcriptOverride?: string,
  backgroundColor?: string,
  outputFormat?: "doc" | "presentation" | "notes"
): Promise<void> {
  const transcript = transcriptOverride?.trim() || currentTranscript?.trim();
  if (!transcript) {
    broadcastStatus("error", "No transcript available — please record again");
    return;
  }
  if (transcript.length < 50) {
    broadcastStatus("error", "Transcript too short (need 50+ characters)");
    return;
  }

  const format = outputFormat ?? "doc";
  const isPrototype = format === "prototype";

  try {
    // ── Research phase: run in parallel for all selected topics ──
    if (selectedPoints.length > 0) {
      const needsResearch = selectedPoints.filter(
        (t) => !topicResearchMap.has(t) || topicResearchMap.get(t)?.status === "error"
      );
      if (needsResearch.length > 0) {
        broadcastStatus("researching", `Researching ${needsResearch.length} topic${needsResearch.length > 1 ? "s" : ""}…`);
        await Promise.all(needsResearch.map((t) => startTopicResearch(t)));
      }
    }

    // ── Generation phase ──
    broadcastStatus(
      "generating",
      isPrototype ? "Claude is building your prototype…" : format === "doc" ? "Claude is writing your document…" : "Generating…"
    );

    let html: string;

    if (format === "prototype") {
      // Claude outputs raw HTML — no JSON parsing needed
      const researchContext = selectedPoints
        .map((t) => topicResearchMap.get(t))
        .filter((r): r is TopicResearch => !!r && r.status === "done")
        .map((r) => ({ topic: r.topic, summary: r.summary, keyInsight: r.keyInsight, subtopics: r.subtopics }));

      let tokenCount = 0;
      html = await claudeStream(
        PROTOTYPE_SYSTEM,
        prototypeUser(transcript, selectedPoints, customPrompt, researchContext),
        "sonnet",
        (t) => {
          tokenCount = t;
          broadcastStatus("generating", `Building prototype… (~${Math.round(tokenCount / 4)} words)`);
        }
      );

      // Strip any accidental markdown fences Claude might add
      html = html.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
      if (!html.toLowerCase().startsWith("<!") && !html.toLowerCase().startsWith("<html")) {
        throw new Error("Claude did not return valid HTML for the prototype. Try again.");
      }
    } else if (format === "doc") {
      // Gather research context for selected topics
      const researchContext = selectedPoints
        .map((t) => topicResearchMap.get(t))
        .filter((r): r is TopicResearch => !!r && r.status === "done")
        .map((r) => ({
          topic: r.topic,
          summary: r.summary,
          keyInsight: r.keyInsight,
          subtopics: r.subtopics,
        }));

      let tokenCount = 0;
      const rawJson = await claudeStream(
        DOC_SYSTEM,
        docUser(transcript, selectedPoints, customPrompt, researchContext),
        "sonnet",
        (t) => {
          tokenCount = t;
          broadcastStatus("generating", `Claude is writing… (~${Math.round(tokenCount / 4)} words)`);
        }
      );

      const parsed = parseJsonResponse(rawJson);

      // Validate and build topics
      const rawTopics = Array.isArray(parsed.topics) ? parsed.topics : [];
      const validTopics: DocTopic[] = rawTopics
        .slice(0, 12)
        .filter((t): t is Record<string, unknown> => t !== null && typeof t === "object")
        .map((t) => ({
          title: typeof t.title === "string" ? t.title : "Topic",
          summary: typeof t.summary === "string" ? t.summary : "",
          keyDecision:
            t.keyDecision && typeof t.keyDecision === "string" ? t.keyDecision : null,
          subtopics: Array.isArray(t.subtopics)
            ? (t.subtopics as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 8)
            : [],
          actionItems: Array.isArray(t.actionItems)
            ? (t.actionItems as unknown[]).filter((a): a is string => typeof a === "string").slice(0, 6)
            : [],
        }))
        .filter((t) => t.subtopics.length > 0 || t.summary.length > 0);

      const docData: MeetingDocData = {
        title: typeof parsed.title === "string" ? parsed.title : "Meeting Notes",
        subtitle: typeof parsed.subtitle === "string" ? parsed.subtitle : undefined,
        summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
        topics:
          validTopics.length > 0
            ? validTopics
            : [{ title: "Summary", summary: "Add content from transcript", subtopics: [] }],
        overallActionItems: Array.isArray(parsed.overallActionItems)
          ? (parsed.overallActionItems as unknown[])
              .filter((a): a is string => typeof a === "string")
              .slice(0, 10)
          : [],
      };

      html = buildMeetingDoc(docData);
    } else if (format === "notes") {
      const rawJson = await claudeStream(NOTES_SYSTEM, notesUser(transcript, selectedPoints, customPrompt));
      const parsedObj = parseJsonResponse(rawJson);
      const sectionsRaw = Array.isArray(parsedObj.sections) ? parsedObj.sections : [];
      const validSections = sectionsRaw
        .slice(0, 8)
        .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
        .map((s) => ({
          heading: typeof s.heading === "string" ? s.heading : "Section",
          items: Array.isArray(s.items)
            ? (s.items as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 12)
            : [],
          chart: validChart(s.chart),
          mermaid:
            typeof s.mermaid === "string" && s.mermaid.trim()
              ? s.mermaid.trim().slice(0, 2000)
              : undefined,
        }))
        .filter((s) => s.items.length > 0 || s.chart || s.mermaid);

      const notesData: NotesData = {
        title: typeof parsedObj.title === "string" ? parsedObj.title : "Meeting Notes",
        subtitle: typeof parsedObj.subtitle === "string" ? parsedObj.subtitle : undefined,
        sections:
          validSections.length >= 1
            ? validSections
            : [{ heading: "Summary", items: ["Add content from transcript"] }],
      };
      html = buildNotesHtml(notesData);
    } else {
      // Reveal.js presentation
      const bgColor = (() => {
        let c = backgroundColor?.trim().toLowerCase();
        if (!c && /green\s*(background|theme|slide)/i.test(customPrompt)) c = "green";
        if (!c && /blue\s*(background|theme|slide)/i.test(customPrompt)) c = "blue";
        if (!c && /light\s*(background|theme|slide)/i.test(customPrompt)) c = "light";
        return c;
      })();

      const rawJson = await claudeStream(DECK_SYSTEM, deckUser(transcript, selectedPoints, customPrompt));
      const parsedObj = parseJsonResponse(rawJson);
      const slides = Array.isArray(parsedObj.slides) ? parsedObj.slides : [];
      const validSlides = slides
        .slice(0, 12)
        .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
        .map((s) => ({
          title: typeof s.title === "string" ? s.title : "Slide",
          bullets: Array.isArray(s.bullets)
            ? (s.bullets as unknown[]).filter((b): b is string => typeof b === "string").slice(0, 10)
            : [],
          notes: typeof s.notes === "string" ? s.notes : undefined,
          chart: validChart(s.chart),
          mermaid:
            typeof s.mermaid === "string" && s.mermaid.trim()
              ? s.mermaid.trim().slice(0, 2000)
              : undefined,
        }));

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

    const prefix =
      format === "prototype" ? "decker-prototype"
      : format === "doc" ? "decker-doc"
      : format === "notes" ? "decker-notes"
      : "decker-deck";
    const filename = `${prefix}-${Date.now()}.html`;

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: false });

    broadcastStatus("done", `Saved as ${filename}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    debugLog(`runPhase2 FAILED: ${msg}`);
    broadcastStatus("error", msg);
  }
}

// ---------------------------------------------------------------------------
// Message listener
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
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

    // Full state restore — used when popup is reopened mid-session
    case MessageType.GET_FULL_STATE: {
      const fullState: FullStateResponse = {
        status: currentStatus,
        message: undefined,
        transcript: currentTranscript ?? (accumulatedTranscript || undefined),
        points: liveTopics.length > 0 ? liveTopics : undefined,
        topicResearch:
          topicResearchMap.size > 0 ? Array.from(topicResearchMap.values()) : undefined,
        hasHtml: lastGeneratedHtml !== null,
        claudeKey,
        openaiKey,
      };
      sendResponse(fullState);
      return false;
    }

    case MessageType.GET_API_SETTINGS: {
      sendResponse({ claudeKey, openaiKey });
      return false;
    }

    case MessageType.GET_DEBUG_LOG: {
      chrome.storage.local.get(DEBUG_LOG_KEY, (r) => {
        try {
          sendResponse({ log: (r[DEBUG_LOG_KEY] as string[]) ?? [] });
        } catch {}
      });
      return true;
    }

    case MessageType.SET_API_SETTINGS: {
      const settings = msg.payload as ApiSettings;
      claudeKey = settings.claudeKey ?? "";
      openaiKey = settings.openaiKey ?? "";
      chrome.storage.local.set({ claudeKey, openaiKey });
      sendResponse({ ok: true });
      return false;
    }

    case MessageType.START_RECORDING_WITH_STREAM: {
      const payload = msg.payload as StartRecordingStreamPayload;
      debugLog("START_RECORDING received");
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

    case MessageType.TOPIC_SELECTED: {
      const { topic } = msg.payload as TopicSelectedPayload;
      if (topic) {
        debugLog(`Topic selected: "${topic}" — starting background research`);
        startTopicResearch(topic).catch(console.error);
      }
      sendResponse({ ok: true });
      return false;
    }

    case MessageType.TOPIC_DESELECTED: {
      // Research already in progress — just let it finish; result will be cached
      sendResponse({ ok: true });
      return false;
    }

    case MessageType.AUDIO_CHUNK: {
      const payload = msg.payload as AudioChunkPayload;
      if (payload?.base64 && payload?.mimeType) {
        chunkQueue.push({ base64: payload.base64, mimeType: payload.mimeType });
        debugLog(`AUDIO_CHUNK received, queue: ${chunkQueue.length}`);
        processChunkQueue().catch(console.error);
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
      if (payload?.status === "error") debugLog(`Error from offscreen: ${payload.message ?? "unknown"}`);
      broadcastStatus(payload.status, payload.message);
      return false;
    }

    default:
      return false;
  }
});

console.log("[Decker background] Service worker started (Claude-powered)");
