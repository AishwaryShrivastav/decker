import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  OffscreenStartPayload,
  RecordingStoppedPayload,
  ApiSettings,
  GenerateDeckPayload,
  OutputFormat,
  StartRecordingStreamPayload,
  TopicResearch,
  TopicSelectedPayload,
  FullStateResponse,
} from "../shared/types";
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
  PRESENTATION_SYSTEM,
  presentationUser,
  DISCUSSION_SPA_SYSTEM,
  discussionSpaUser,
} from "../shared/prompts";

import { freshSession, recoverSession, processPendingChunks, transcriptForGeneration, reconcileTopics, addWarning, addCaptureNotice } from "../shared/capture";
import type { TranscriptEdit } from "../shared/capture";
import { loadSession, saveSession } from "../shared/sessionStore";
import { recordActivation } from "../shared/activation";

const OPENAI_API_BASE = "https://api.openai.com/v1";
const GPT_MINI = "gpt-4o-mini"; // fast + cheap — topic extraction, research
const GPT_FULL = "gpt-4o";      // final doc/deck generation

// The durable session is the source of truth. Runtime locks are reconstructed.
let session = freshSession();
let chunkProcessing: Promise<void> | null = null;
let finalizing: Promise<void> | null = null;
let isExtractingTopics = false;
let openaiKey = "";

// Live topic + research state
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

async function persist(): Promise<void> {
  session.research = Array.from(topicResearchMap.values());
  await saveSession(session);
}

const ready = (async () => {
  const [settings, saved] = await Promise.all([
    chrome.storage.local.get(["openaiKey"]), loadSession(),
  ]);
  openaiKey = typeof settings.openaiKey === 'string' ? settings.openaiKey.trim() : '';
  if (saved) session = recoverSession(saved);
  session.research.forEach(r => topicResearchMap.set(r.topic, r));
})();

async function resumeSession(): Promise<void> {
  await ready;
  if (['recording', 'processing', 'finalizing', 'transcribing', 'extracting'].includes(session.status)) {
    let capture: { sessionId?: string; active?: boolean; finishing?: boolean } | undefined;
    try { capture = await chrome.runtime.sendMessage({ type: MessageType.OFFSCREEN_STATUS }); } catch { /* recorder is gone */ }
    if (!session.finalReceived && (capture?.sessionId !== session.id || (!capture.active && !capture.finishing))) {
      addWarning(session, 'Capture was interrupted. Audio after the last saved segment may be missing.');
      session.finalReceived = true;
      session.status = 'processing';
      await persist();
    }
    if (session.finalReceived) void finishSession();
    else void processChunkQueue().catch(reportQueueFailure);
  }
}

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
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { text: string };
  return typeof data.text === "string" ? data.text.trim() : "";
}

// ---------------------------------------------------------------------------
// LLM helpers (OpenAI chat completions)
// ---------------------------------------------------------------------------

/**
 * Non-streaming completion — for topic extraction and research.
 * Uses gpt-4o-mini by default (fast + cheap for structured extraction).
 */
async function llmComplete(
  systemPrompt: string,
  userMessage: string,
  model: "mini" | "full" = "mini"
): Promise<string> {
  if (!openaiKey) throw new Error("No OpenAI key set — add it in Decker settings (⚙).");
  const modelId = model === "mini" ? GPT_MINI : GPT_FULL;

  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${modelId} error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { choices: { message?: { content?: string | null } }[] };
  return data.choices[0]?.message?.content ?? "{}";
}

/**
 * Streaming completion — for final doc/deck generation.
 * Uses gpt-4o by default. Calls onProgress every ~100 tokens.
 */
async function llmStream(
  systemPrompt: string,
  userMessage: string,
  model: "mini" | "full" = "full",
  onProgress?: (tokenCount: number) => void
): Promise<string> {
  if (!openaiKey) throw new Error("No OpenAI key set — add it in Decker settings (⚙).");
  const modelId = model === "mini" ? GPT_MINI : GPT_FULL;

  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 16384,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${modelId} stream error ${res.status}: ${err}`);
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
            choices?: { delta?: { content?: string | null } }[];
          };
          const deltaText = event.choices?.[0]?.delta?.content;
          if (deltaText) {
            fullText += deltaText;
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
    topicResearch?: TopicResearch[];
  }
): void {
  session.status = status;
  session.message = message;
  const payload: StatusPayload = { status, message, ...extra, sessionId: session.id,
    transcriptRevision: session.transcriptRevision, warnings: session.warnings,
    selectedPoints: session.selectedPoints };
  void persist().catch(() => {
    const warning = 'Session recovery could not be saved. Keep Decker open and copy the transcript before leaving.';
    addWarning(session, warning);
    chrome.runtime.sendMessage({ type: MessageType.STATUS_UPDATE,
      payload: { ...payload, warnings: session.warnings } }).catch(() => {});
  });
  chrome.runtime
    .sendMessage<Message<StatusPayload>>({ type: MessageType.STATUS_UPDATE, payload })
    .catch(() => {});

}

// ---------------------------------------------------------------------------
// Broadcast helper: push current research map to popup
// ---------------------------------------------------------------------------
function broadcastResearchUpdate(): void {
  broadcastStatus(session.status, session.message, {
    topicResearch: Array.from(topicResearchMap.values()),
  });
}

// ---------------------------------------------------------------------------
// Live topic extraction (called every 3 transcribed chunks)
// ---------------------------------------------------------------------------
async function updateLiveTopics(): Promise<void> {
  if (isExtractingTopics || session.transcript.length < 100) return;
  isExtractingTopics = true;
  const id = session.id;
  try {
    const raw = await llmComplete(EXTRACT_POINTS_SYSTEM, extractPointsUser(session.transcript));
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { points?: unknown };
    const newPoints = Array.isArray(parsed.points)
      ? (parsed.points as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 12)
      : [];

    if (id === session.id && session.status === "recording" && newPoints.length > 0) {
      reconcileTopics(session, newPoints);
      debugLog(`Live topics updated: ${newPoints.length} topics`);
      broadcastStatus("recording", undefined, {
        transcript: session.transcript,
        points: session.points,
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
  const id = session.id;

  // Mark as in-progress
  topicResearchMap.set(topic, { topic, status: "researching" });
  broadcastResearchUpdate();

  const transcript = session.transcript;

  try {
    const raw = await llmComplete(RESEARCH_SYSTEM, researchUser(topic, transcript));
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as {
      context?: string;
      keyInsight?: string;
      subtopics?: string[];
    };

    if (id !== session.id) return;
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
    if (id !== session.id) return;
    debugLog(`Research failed for "${topic}": ${err instanceof Error ? err.message : String(err)}`);
    topicResearchMap.set(topic, { topic, status: "error" });
  } finally {
    if (id === session.id) researchInProgress.delete(topic);
  }

  if (id === session.id) broadcastResearchUpdate();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mimeType });
}

function stripHtmlFences(raw: string): string {
  return raw.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
}

function assertValidHtml(html: string, label: string): void {
  const lower = html.toLowerCase();
  if (!lower.startsWith("<!") && !lower.startsWith("<html")) {
    throw new Error(`The model did not return valid HTML for the ${label}. Try again.`);
  }
}

// ---------------------------------------------------------------------------
// Chunk transcription pipeline
// ---------------------------------------------------------------------------
async function transcribeChunk(base64: string, mimeType: string): Promise<string> {
  return openaiTranscribe(base64ToBlob(base64, mimeType));
}

function reportQueueFailure(): void {
  addWarning(session, 'Pending audio could not be saved. Keep the session open and copy the transcript before leaving.');
  broadcastStatus(session.status, session.message, { transcript: session.transcript });
}

function processChunkQueue(): Promise<void> {
  if (chunkProcessing) return chunkProcessing;
  chunkProcessing = processPendingChunks(session,
    chunk => transcribeChunk(chunk.base64, chunk.mimeType), persist, undefined, () => {
      broadcastStatus(session.status, session.message, { transcript: session.transcript });
      if (session.status === 'recording' && session.transcriptRevision % 3 === 0) void updateLiveTopics();
    }).finally(() => { chunkProcessing = null; });
  return chunkProcessing;
}

function checkKey(): void {
  if (!openaiKey.trim()) throw new Error('Add and save an OpenAI key in Settings before recording.');
}

async function startRecordingWithStream(tabId: number, streamId: string): Promise<void> {
  checkKey();
  if (!['idle', 'done', 'error', 'reviewing'].includes(session.status) || chunkProcessing || finalizing) {
    throw new Error('A capture or generation is already in progress.');
  }
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || new URL(tab.url).hostname !== 'meet.google.com') throw new Error('Open a Google Meet tab first.');
  session = freshSession();
  session.tabId = tabId;
  session.status = 'processing';
  topicResearchMap.clear();
  researchInProgress.clear();
  await persist();
  try {
    await ensureOffscreenDocument();
    const response = await chrome.runtime.sendMessage<Message<OffscreenStartPayload>>({
      type: MessageType.OFFSCREEN_START, payload: { streamId, sessionId: session.id },
    }) as { ok?: boolean; error?: string; warnings?: string[] };
    if (!response?.ok) throw new Error(response?.error ?? 'Audio capture did not start.');
    response.warnings?.forEach(w => addWarning(session, w));
    broadcastStatus('recording');
    void recordActivation('recording_started').catch(() => {});
  } catch (error) {
    broadcastStatus('error', error instanceof Error ? error.message : String(error));
    await closeOffscreenDocument();
    throw error;
  }
}

async function stopRecording(): Promise<void> {
  if (session.status !== 'recording') return;
  broadcastStatus('processing', 'Finishing audio capture...');
  try {
    const response = await chrome.runtime.sendMessage({ type: MessageType.OFFSCREEN_STOP });
    if (!response?.ok) throw new Error('Recorder is unavailable');
  } catch {
    addWarning(session, 'Capture ended unexpectedly. Audio after the last saved segment may be missing.');
    session.finalReceived = true;
    await persist();
    void finishSession();
  }
}

function finishSession(): Promise<void> {
  if (finalizing) return finalizing;
  finalizing = runPhase1().finally(() => { finalizing = null; });
  return finalizing;
}

async function runPhase1(): Promise<void> {
  try {
    broadcastStatus('transcribing', 'Finishing transcription...');
    await processChunkQueue();
    // Publish the complete transcript before topic extraction, which can fail.
    broadcastStatus('extracting', 'Extracting discussion topics...', { transcript: session.transcript });
    try {
      if (session.transcript.trim()) {
        const raw = await llmComplete(EXTRACT_POINTS_SYSTEM, extractPointsUser(session.transcript));
        const parsed = parseJsonResponse(raw);
        const points = Array.isArray(parsed.points) ? parsed.points.filter((p): p is string => typeof p === 'string').slice(0, 12) : [];
        if (points.length) reconcileTopics(session, points);
      }
    } catch {
      addWarning(session, 'Topic extraction failed. The transcript is available for review; you can still generate a document.');
    }
    if (!session.transcript.trim()) addWarning(session, 'No speech was transcribed. Check tab audio and microphone access, or paste a transcript.');
    broadcastStatus('reviewing', undefined, { transcript: session.transcript, points: session.points,
      topicResearch: Array.from(topicResearchMap.values()) });
    await persist();
    if (session.transcript.trim()) void recordActivation('transcript_ready').catch(() => {});
    await closeOffscreenDocument();
  } catch {
    broadcastStatus('reviewing', 'Recovery storage failed. Copy your transcript before leaving.', { transcript: session.transcript });
  }
}

// ---------------------------------------------------------------------------
// Validate + parse JSON output helpers (shared)
// ---------------------------------------------------------------------------
function parseJsonResponse(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Phase 2: research selected topics → generate document/deck
// ---------------------------------------------------------------------------
async function runPhase2(
  selectedPoints: string[],
  customPrompt: string,
  transcriptEdit?: TranscriptEdit,
  outputFormat?: OutputFormat
): Promise<void> {
  const transcript = transcriptForGeneration(session, transcriptEdit).trim();
  if (!transcript) {
    broadcastStatus("error", "No transcript available — please record again");
    return;
  }
  if (transcript.length < 50) {
    broadcastStatus("error", "Transcript too short (need 50+ characters)");
    return;
  }

  const format: OutputFormat = outputFormat ?? "doc";

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
      format === "prototype" ? "Building your prototype…"
        : format === "doc" ? "Writing your document…"
        : format === "presentation" ? "Building your presentation…"
        : "Building your discussion site…"
    );

    // Collect research context for all formats
    const researchContext = selectedPoints
      .map((t) => topicResearchMap.get(t))
      .filter((r): r is TopicResearch => !!r && r.status === "done")
      .map((r) => ({ topic: r.topic, summary: r.summary, keyInsight: r.keyInsight, subtopics: r.subtopics }));

    let html: string;

    if (format === "prototype") {
      let tokenCount = 0;
      html = await llmStream(
        PROTOTYPE_SYSTEM,
        prototypeUser(transcript, selectedPoints, customPrompt, researchContext),
        "full",
        (t) => {
          tokenCount = t;
          broadcastStatus("generating", `Building prototype… (~${Math.round(tokenCount / 4)} words)`);
        }
      );

      html = stripHtmlFences(html);
      assertValidHtml(html, "prototype");
    } else if (format === "doc") {
      let tokenCount = 0;
      const rawJson = await llmStream(
        DOC_SYSTEM,
        docUser(transcript, selectedPoints, customPrompt, researchContext),
        "full",
        (t) => {
          tokenCount = t;
          broadcastStatus("generating", `Writing your document… (~${Math.round(tokenCount / 4)} words)`);
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
      // Discussion SPA — the model generates a raw HTML website
      let tokenCount = 0;
      html = await llmStream(
        DISCUSSION_SPA_SYSTEM,
        discussionSpaUser(transcript, selectedPoints, customPrompt, researchContext),
        "full",
        (t) => {
          tokenCount = t;
          broadcastStatus("generating", `Building discussion site… (~${Math.round(tokenCount / 4)} words)`);
        }
      );
      html = stripHtmlFences(html);
      assertValidHtml(html, "discussion site");
    } else {
      // Presentation — the model generates a raw HTML deck
      let tokenCount = 0;
      html = await llmStream(
        PRESENTATION_SYSTEM,
        presentationUser(transcript, selectedPoints, customPrompt, researchContext),
        "full",
        (t) => {
          tokenCount = t;
          broadcastStatus("generating", `Building presentation… (~${Math.round(tokenCount / 4)} words)`);
        }
      );
      html = stripHtmlFences(html);
      assertValidHtml(html, "presentation");
    }

    html = addCaptureNotice(html, session.warnings);
    session.html = html;
    await persist();

    const prefix =
      format === "prototype" ? "decker-prototype"
      : format === "doc" ? "decker-doc"
      : format === "notes" ? "decker-notes"
      : "decker-deck";
    const filename = `${prefix}-${Date.now()}.html`;

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: false });

    void recordActivation('output_generated').catch(() => {});
    broadcastStatus("done", `Saved as ${filename}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    debugLog(`runPhase2 FAILED: ${msg}`);
    broadcastStatus("reviewing", msg, { transcript: session.transcript, points: session.points });
  }
}

// ---------------------------------------------------------------------------
// Message listener
// ---------------------------------------------------------------------------
async function handleMessage(msg: Message, sender: chrome.runtime.MessageSender): Promise<unknown> {
  await ready;
  switch (msg.type) {
    case MessageType.GET_TAB_ID: return { tabId: sender.tab?.id ?? null };
    case MessageType.GET_STATUS: return { status: session.status };
    case MessageType.GET_FULL_STATE: {
      void resumeSession().catch(reportQueueFailure);
      const fullState: FullStateResponse = {
        sessionId: session.id, status: session.status, message: session.message,
        transcript: session.transcript, transcriptRevision: session.transcriptRevision,
        points: session.points, selectedPoints: session.selectedPoints, warnings: session.warnings,
        customPrompt: session.customPrompt, outputFormat: session.outputFormat, edit: session.edit,
        topicResearch: Array.from(topicResearchMap.values()), hasHtml: session.html !== null, openaiKey,
      };
      return fullState;
    }
    case MessageType.GET_API_SETTINGS: return { openaiKey };
    case MessageType.GET_DEBUG_LOG: {
      const r = await chrome.storage.local.get(DEBUG_LOG_KEY);
      return { log: r[DEBUG_LOG_KEY] ?? [] };
    }
    case MessageType.SET_API_SETTINGS: {
      openaiKey = (msg.payload as ApiSettings).openaiKey?.trim() ?? '';
      await chrome.storage.local.set({ openaiKey });
      if (openaiKey) void recordActivation('key_saved').catch(() => {});
      return { ok: true };
    }
    case MessageType.PREFLIGHT: checkKey(); return { ok: true };
    case MessageType.START_RECORDING_WITH_STREAM: {
      const payload = msg.payload as StartRecordingStreamPayload;
      await startRecordingWithStream(payload.tabId, payload.streamId);
      return { ok: true };
    }
    case MessageType.START_RECORDING: return { error: 'Use Start Recording from the popup.' };
    case MessageType.STOP_RECORDING: await stopRecording(); return { ok: true };
    case MessageType.TOPIC_SELECTED: {
      const { topic } = msg.payload as TopicSelectedPayload;
      if (topic && session.points.includes(topic)) {
        if (!session.selectedPoints.includes(topic)) session.selectedPoints.push(topic);
        await persist();
        void startTopicResearch(topic);
      }
      return { ok: true };
    }
    case MessageType.TOPIC_DESELECTED: {
      const { topic } = msg.payload as TopicSelectedPayload;
      session.selectedPoints = session.selectedPoints.filter(p => p !== topic);
      await persist(); return { ok: true };
    }
    case MessageType.SAVE_REVIEW: {
      const payload = msg.payload as { sessionId: string; selectedPoints?: string[]; customPrompt?: string; outputFormat?: OutputFormat; edit?: TranscriptEdit };
      if (payload.sessionId !== session.id) return { error: 'This session has changed. Reopen Decker.' };
      if (payload.selectedPoints) session.selectedPoints = payload.selectedPoints.filter(p => session.points.includes(p));
      if (payload.customPrompt !== undefined) session.customPrompt = payload.customPrompt;
      if (payload.outputFormat) session.outputFormat = payload.outputFormat;
      if (payload.edit) session.edit = payload.edit;
      await persist(); return { ok: true };
    }
    case MessageType.AUDIO_CHUNK:
    case MessageType.RECORDING_STOPPED: {
      const payload = msg.payload as RecordingStoppedPayload;
      if (payload.sessionId !== session.id) return { error: 'Expired capture session' };
      if (!Number.isInteger(payload.sequence) || payload.sequence < 0) return { error: 'Invalid audio sequence' };
      if (payload.sequence > session.lastSequence && !session.finalReceived) {
        for (let i = session.lastSequence + 1; i < payload.sequence; i++) {
          addWarning(session, `Missing audio segment ${i + 1}: audio delivery failed.`);
        }
        if (payload.base64) session.queue.push({ ...payload, attempts: 0 });
        session.lastSequence = payload.sequence;
      }
      if (msg.type === MessageType.RECORDING_STOPPED) {
        payload.missingSequences?.forEach(i => addWarning(session, `Missing audio segment ${i + 1}: audio delivery failed.`));
        session.finalReceived = true;
      }
      // Acknowledgement means the audio/final marker is durable, not transcribed.
      await persist();
      if (session.finalReceived && !['reviewing', 'done', 'generating', 'researching'].includes(session.status)) void finishSession();
      else if (!session.finalReceived) void processChunkQueue().catch(reportQueueFailure);
      return { ok: true };
    }
    case MessageType.CAPTURE_WARNING: {
      const payload = msg.payload as { sessionId: string; warning: string };
      if (payload.sessionId === session.id) {
        addWarning(session, payload.warning);
        broadcastStatus(session.status, session.message);
        await persist();
      }
      return { ok: true };
    }
    case MessageType.GENERATE_DECK: {
      const payload = msg.payload as GenerateDeckPayload;
      if (payload.sessionId !== session.id || session.status !== 'reviewing') return { error: 'Wait for the complete transcript before generating.' };
      checkKey();
      session.selectedPoints = payload.selectedPoints;
      session.customPrompt = payload.customPrompt;
      session.outputFormat = payload.outputFormat ?? 'doc';
      const edit = payload.transcriptEdited && payload.transcript !== undefined
        ? { text: payload.transcript, baseRevision: payload.transcriptRevision ?? -1 } : undefined;
      if (edit && edit.baseRevision !== session.transcriptRevision) {
        return { error: 'The transcript changed after this edit. Review the latest transcript before generating.' };
      }
      session.edit = edit;
      session.status = 'generating';
      await persist();
      void runPhase2(payload.selectedPoints, payload.customPrompt, edit, payload.outputFormat);
      return { ok: true };
    }
    case MessageType.RESET_STATE: {
      if (chunkProcessing || finalizing || !['idle', 'reviewing', 'done', 'error'].includes(session.status)) return { error: 'Stop capture and wait for processing before resetting.' };
      session = freshSession(); topicResearchMap.clear(); researchInProgress.clear();
      await persist(); return { ok: true };
    }
    case MessageType.GET_LAST_HTML: return { html: session.html };
    default: return undefined;
  }
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  // Do not claim messages intended for offscreen or our own UI broadcasts.
  if ([MessageType.OFFSCREEN_START, MessageType.OFFSCREEN_STOP, MessageType.OFFSCREEN_STATUS, MessageType.STATUS_UPDATE].includes(message.type)) return false;
  handleMessage(message, sender).then(sendResponse, error => sendResponse({ error: error instanceof Error ? error.message : String(error) }));
  return true;
});

void resumeSession().catch(() => {
  broadcastStatus('error', 'Could not recover the saved session. Reload Decker and try again.');
});
