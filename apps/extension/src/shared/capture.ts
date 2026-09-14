import type { AudioChunkPayload, OutputFormat, RecordingStatus, TopicResearch } from './types';

export interface TranscriptEdit { text: string; baseRevision: number }
export interface PendingChunk extends AudioChunkPayload { attempts: number }
export interface CaptureSession {
  id: string;
  status: RecordingStatus;
  message?: string;
  tabId: number | null;
  transcript: string;
  transcriptRevision: number;
  edit?: TranscriptEdit;
  points: string[];
  selectedPoints: string[];
  customPrompt: string;
  outputFormat: OutputFormat;
  research: TopicResearch[];
  warnings: string[];
  queue: PendingChunk[];
  lastSequence: number;
  finalReceived: boolean;
  html: string | null;
}

export function freshSession(id = crypto.randomUUID()): CaptureSession {
  return { id, status: 'idle', tabId: null, transcript: '', transcriptRevision: 0,
    points: [], selectedPoints: [], customPrompt: '', outputFormat: 'doc', research: [],
    warnings: [], queue: [], lastSequence: -1, finalReceived: false, html: null };
}

export function recoverSession(saved: CaptureSession): CaptureSession {
  const state = structuredClone(saved);
  state.research = state.research.map(r => r.status === 'researching' ? { ...r, status: 'error' } : r);
  if (['generating', 'researching'].includes(state.status)) {
    state.status = 'reviewing';
    state.message = 'Generation was interrupted. Your transcript and instructions were recovered. Generate again when ready.';
  }
  return state;
}

export function transcriptForGeneration(state: CaptureSession, edit = state.edit): string {
  return edit?.baseRevision === state.transcriptRevision ? edit.text : state.transcript;
}

export function reconcileTopics(state: CaptureSession, points: string[]): void {
  state.selectedPoints = points.filter(p => state.selectedPoints.includes(p) || !state.points.includes(p));
  state.points = points;
}

export function addWarning(state: CaptureSession, warning: string): void {
  if (!state.warnings.includes(warning)) state.warnings.push(warning);
}

export const waitForRetry = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
export const MAX_TRANSCRIPTION_ATTEMPTS = 3;

// Keep the head and attempt count durable while a request is in flight. A worker
// restart can repeat a request, but commits its text only once.
export async function processPendingChunks(
  state: CaptureSession,
  transcribe: (chunk: PendingChunk) => Promise<string>,
  save: () => Promise<void>,
  sleep = waitForRetry,
  onProgress: () => void = () => {},
): Promise<void> {
  while (state.queue.length) {
    const chunk = state.queue[0];
    let text: string | undefined;
    while (chunk.attempts < MAX_TRANSCRIPTION_ATTEMPTS) {
      chunk.attempts++;
      await save();
      try {
        text = await transcribe(chunk);
        if (!text.trim()) throw new Error('Empty transcription');
        break;
      } catch {
        if (chunk.attempts < MAX_TRANSCRIPTION_ATTEMPTS) await sleep(1000 * 2 ** (chunk.attempts - 1));
      }
    }
    if (text === undefined || !text.trim()) {
      text = `[Missing audio segment ${chunk.sequence + 1}: transcription failed after ${MAX_TRANSCRIPTION_ATTEMPTS} attempts.]`;
      addWarning(state, text);
    }
    state.transcript = [state.transcript, text].filter(Boolean).join(' ');
    state.transcriptRevision++;
    state.queue.shift();
    await save();
    onProgress();
  }
}

export function addCaptureNotice(html: string, warnings: string[]): string {
  if (!warnings.length) return html;
  const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const notice = `<aside role="note" style="position:relative;z-index:2147483647;padding:16px;background:#fff3cd;color:#533f03;font:14px/1.5 sans-serif"><strong>Capture warnings</strong><ul>${warnings.map(w => `<li>${escape(w)}</li>`).join('')}</ul></aside>`;
  return /<body\b[^>]*>/i.test(html) ? html.replace(/<body\b[^>]*>/i, body => body + notice) : notice + html;
}
