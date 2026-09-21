import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { statusUpdateIsCurrent } from "../popup/model";
import {
  MessageType,
  type FullStateResponse,
  type Message,
  type OutputFormat,
  type RecordingStatus,
  type StatusPayload,
  type TopicResearch,
} from "../shared/types";
import { restoredTranscript } from "./model";

type Notice = { kind: "error" | "success"; text: string } | null;

const formatOptions: { value: OutputFormat; label: string; detail: string }[] = [
  { value: "doc", label: "Document", detail: "Structured notes and action items" },
  { value: "presentation", label: "Presentation", detail: "A Reveal.js slide deck" },
  { value: "prototype", label: "Prototype", detail: "An interactive HTML concept" },
  { value: "notes", label: "Discussion site", detail: "A scrollable HTML summary" },
];

function progressText(status: RecordingStatus, message?: string): string {
  if (message) return message;
  switch (status) {
    case "recording": return "Recording is still active. Stop it from the Decker popup.";
    case "processing": return "Finishing audio capture...";
    case "finalizing": return "Preparing the saved audio...";
    case "transcribing": return "Finishing the transcript...";
    case "extracting": return "Finding discussion topics...";
    case "researching": return "Adding context for selected topics...";
    case "generating": return "Building the artifact...";
    case "done": return "Artifact ready";
    case "reviewing": return "Review the transcript and choose what to create.";
    case "error": return "The session needs attention.";
    default: return "No recording is ready for review.";
  }
}

function researchLabel(research?: TopicResearch): string {
  if (!research || research.status === "pending") return "Waiting";
  if (research.status === "researching") return "Adding context...";
  if (research.status === "done") return "Context ready";
  return "Context unavailable";
}

export function Review() {
  const [state, setState] = useState<FullStateResponse | null>(null);
  const [transcript, setTranscript] = useState("");
  const [canonicalTranscript, setCanonicalTranscript] = useState("");
  const [editBaseRevision, setEditBaseRevision] = useState(0);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("doc");
  const [notice, setNotice] = useState<Notice>(null);
  const [conflict, setConflict] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef({ id: "", generation: -1, revision: 0 });
  const dirtyRef = useRef(false);

  const hydrate = useCallback((next: FullStateResponse) => {
    const restored = restoredTranscript(next);
    sessionRef.current = { id: next.sessionId, generation: next.sessionGeneration, revision: next.transcriptRevision };
    dirtyRef.current = restored.edited;
    setState(next);
    setCanonicalTranscript(next.transcript ?? "");
    setTranscript(restored.text);
    setEditBaseRevision(next.transcriptRevision);
    setSelectedPoints(next.selectedPoints);
    setCustomPrompt(next.customPrompt);
    setOutputFormat(next.outputFormat);
    setConflict(false);
  }, []);

  useEffect(() => {
    const onMessage = (message: Message) => {
      if (message.type !== MessageType.STATUS_UPDATE) return;
      const update = message.payload as StatusPayload;
      const current = sessionRef.current;
      if (!statusUpdateIsCurrent(current.id, current.generation, current.revision, update)) return;

      const nextGeneration = update.sessionGeneration ?? current.generation;
      const nextRevision = update.transcriptRevision ?? current.revision;
      const newSession = nextGeneration > current.generation || (update.sessionId && update.sessionId !== current.id);
      if (newSession) {
        void chrome.runtime.sendMessage<Message>({ type: MessageType.GET_FULL_STATE }).then(hydrate);
        return;
      }
      if (nextRevision > current.revision && dirtyRef.current) setConflict(true);
      sessionRef.current = { id: update.sessionId ?? current.id, generation: nextGeneration, revision: nextRevision };
      setState(previous => previous ? {
        ...previous,
        status: update.status,
        message: update.message,
        transcriptRevision: nextRevision,
        warnings: update.warnings ?? previous.warnings,
        transcript: update.transcript ?? previous.transcript,
        points: update.points ?? previous.points,
        selectedPoints: update.selectedPoints ?? previous.selectedPoints,
        topicResearch: update.topicResearch ?? previous.topicResearch,
        hasHtml: update.hasHtml ?? previous.hasHtml,
      } : previous);
      if (update.transcript !== undefined) {
        setCanonicalTranscript(update.transcript);
        if (!dirtyRef.current) {
          setTranscript(update.transcript);
          setEditBaseRevision(nextRevision);
        }
      }
      if (update.selectedPoints) setSelectedPoints(update.selectedPoints);
    };

    chrome.runtime.onMessage.addListener(onMessage);
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_FULL_STATE })
      .then((response: FullStateResponse & { error?: string }) => {
        if (!response || response.error) throw new Error(response?.error ?? "Decker could not restore the saved session.");
        hydrate(response);
        setHydrated(true);
        requestAnimationFrame(() => headingRef.current?.focus());
      })
      .catch(reason => {
        setNotice({ kind: "error", text: reason instanceof Error ? reason.message : String(reason) });
        setHydrated(true);
      });
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || !state || conflict) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      const edited = transcript !== canonicalTranscript;
      const response = await chrome.runtime.sendMessage({
        type: MessageType.SAVE_REVIEW,
        payload: {
          sessionId: state.sessionId,
          selectedPoints,
          customPrompt,
          outputFormat,
          edit: edited ? { text: transcript, baseRevision: editBaseRevision } : null,
        },
      }).catch(reason => ({ error: reason instanceof Error ? reason.message : String(reason) }));
      setSaving(false);
      if (response?.error) {
        setNotice({ kind: "error", text: response.error });
        if (/transcript changed/i.test(response.error)) setConflict(true);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [canonicalTranscript, conflict, customPrompt, editBaseRevision, hydrated, outputFormat, selectedPoints, state, transcript]);

  useEffect(() => {
    if (notice?.kind === "error") errorRef.current?.focus();
  }, [notice]);

  const researchByTopic = useMemo(
    () => new Map((state?.topicResearch ?? []).map(item => [item.topic, item])),
    [state?.topicResearch]
  );
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const canGenerate = Boolean(state && ["reviewing", "done"].includes(state.status) && transcript.trim().length >= 50 && !conflict);
  const busy = Boolean(state && ["processing", "finalizing", "transcribing", "extracting", "researching", "generating"].includes(state.status));

  const toggleTopic = (topic: string) => {
    const selected = selectedPoints.includes(topic);
    const next = selected ? selectedPoints.filter(item => item !== topic) : [...selectedPoints, topic];
    setSelectedPoints(next);
    void chrome.runtime.sendMessage({
      type: selected ? MessageType.TOPIC_DESELECTED : MessageType.TOPIC_SELECTED,
      payload: { topic },
    });
  };

  const useLatestTranscript = () => {
    const latest = state?.transcript ?? canonicalTranscript;
    dirtyRef.current = false;
    setTranscript(latest);
    setCanonicalTranscript(latest);
    setEditBaseRevision(state?.transcriptRevision ?? sessionRef.current.revision);
    setConflict(false);
    setNotice(null);
  };

  const generate = async () => {
    if (!state || !canGenerate) return;
    setNotice(null);
    const edited = transcript !== canonicalTranscript;
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GENERATE_DECK,
      payload: {
        sessionId: state.sessionId,
        transcriptRevision: editBaseRevision,
        transcriptEdited: edited,
        transcript,
        selectedPoints,
        customPrompt: customPrompt.trim(),
        outputFormat,
      },
    }).catch(reason => ({ error: reason instanceof Error ? reason.message : String(reason) }));
    if (response?.error) {
      setNotice({ kind: "error", text: response.error });
      if (/transcript changed/i.test(response.error)) setConflict(true);
    }
  };

  const copyArtifact = async () => {
    if (!state) return;
    const response = await chrome.runtime.sendMessage({ type: MessageType.GET_LAST_HTML, payload: { sessionId: state.sessionId } });
    if (!response?.html) {
      setNotice({ kind: "error", text: response?.error ?? "No generated artifact is available to copy." });
      return;
    }
    try {
      await navigator.clipboard.writeText(response.html);
      setNotice({ kind: "success", text: "Artifact HTML copied." });
    } catch {
      setNotice({ kind: "error", text: "Chrome could not copy the artifact. Download it instead." });
    }
  };

  const downloadArtifact = async () => {
    if (!state) return;
    const response = await chrome.runtime.sendMessage({ type: MessageType.DOWNLOAD_ARTIFACT, payload: { sessionId: state.sessionId } });
    setNotice(response?.ok
      ? { kind: "success", text: `Download started: ${response.filename}` }
      : { kind: "error", text: response?.error ?? "Chrome could not download the artifact. Try again." });
  };

  if (!hydrated) return <main className="review-shell"><p role="status" aria-live="polite">Restoring your recording...</p></main>;

  return (
    <main className="review-shell">
      <header className="page-header">
        <div className="brand"><img src={chrome.runtime.getURL("icons/icon48.png")} width="32" height="32" alt="" /><span>Decker</span></div>
        <div className="provider">{state ? `${state.provider === "gemini" ? "Gemini" : "OpenAI"} is connected` : "Review"}</div>
      </header>

      <section className="intro" aria-labelledby="review-title">
        <p className="eyebrow">Recording review</p>
        <h1 id="review-title" ref={headingRef} tabIndex={-1}>Shape the transcript into something useful.</h1>
        <p>Edit the words, choose the topics that matter, then pick an output.</p>
      </section>

      <div className={`progress ${busy ? "is-busy" : ""}`} role="status" aria-live="polite" aria-atomic="true">
        <span className="progress-mark" aria-hidden="true" />
        <span>{state ? progressText(state.status, state.message) : "No saved recording found."}</span>
        {saving && <span className="save-state">Saving changes...</span>}
      </div>

      {notice && <div ref={errorRef} tabIndex={notice.kind === "error" ? -1 : undefined} role={notice.kind === "error" ? "alert" : "status"} className={`notice ${notice.kind}`}>{notice.text}</div>}
      {conflict && (
        <div role="alert" className="notice error conflict">
          <span>The transcript changed while you were editing. Load the latest version before generating.</span>
          <button type="button" className="text-button" onClick={useLatestTranscript}>Use latest transcript</button>
        </div>
      )}

      {(state?.warnings.length ?? 0) > 0 && (
        <section className="warning-card" aria-labelledby="capture-warnings">
          <h2 id="capture-warnings">Capture warnings</h2>
          <ul>{state?.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
        </section>
      )}

      <div className="review-grid">
        <section className="card transcript-card" aria-labelledby="transcript-heading">
          <div className="section-heading">
            <div><p className="step">1</p><h2 id="transcript-heading">Transcript</h2></div>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
          <label className="sr-only" htmlFor="meeting-transcript">Meeting transcript</label>
          <textarea
            id="meeting-transcript"
            value={transcript}
            onChange={event => { dirtyRef.current = event.target.value !== canonicalTranscript; setTranscript(event.target.value); setNotice(null); }}
            placeholder="Your transcript will appear here when processing finishes."
            spellCheck
          />
          {transcript.trim().length > 0 && transcript.trim().length < 50 && <p className="field-note">Add a little more detail before generating. The transcript needs at least 50 characters.</p>}
        </section>

        <aside className="side-column">
          <section className="card" aria-labelledby="topics-heading">
            <div className="section-heading">
              <div><p className="step">2</p><h2 id="topics-heading">Topics</h2></div>
              {state?.points?.length ? <button type="button" className="text-button" onClick={() => setSelectedPoints(selectedPoints.length === state.points!.length ? [] : [...state.points!])}>{selectedPoints.length === state.points.length ? "Clear" : "Select all"}</button> : null}
            </div>
            {state?.points?.length ? (
              <div className="topic-list">
                {state.points.map(topic => (
                  <label className="topic" key={topic}>
                    <input type="checkbox" checked={selectedPoints.includes(topic)} onChange={() => toggleTopic(topic)} />
                    <span><strong>{topic}</strong><small>{researchLabel(researchByTopic.get(topic))}</small></span>
                  </label>
                ))}
              </div>
            ) : <p className="empty-note">No topics were found. You can still generate from the full transcript.</p>}
            <p className="sr-only" aria-live="polite">Research status: {(state?.topicResearch ?? []).map(item => `${item.topic}: ${researchLabel(item)}`).join(", ") || "No topic research"}</p>
          </section>

          <section className="card" aria-labelledby="output-heading">
            <div className="section-heading"><div><p className="step">3</p><h2 id="output-heading">Output</h2></div></div>
            <fieldset className="format-list"><legend className="sr-only">Output format</legend>
              {formatOptions.map(option => (
                <label className={`format ${outputFormat === option.value ? "selected" : ""}`} key={option.value}>
                  <input type="radio" name="output-format" value={option.value} checked={outputFormat === option.value} onChange={() => setOutputFormat(option.value)} />
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                </label>
              ))}
            </fieldset>
            <label className="field-label" htmlFor="custom-instructions">Custom instructions</label>
            <textarea id="custom-instructions" className="instructions" value={customPrompt} onChange={event => setCustomPrompt(event.target.value)} placeholder="Example: Put decisions first and name each owner." />
            <button type="button" className="primary" disabled={!canGenerate} onClick={generate}>{state?.status === "done" ? "Generate again" : "Generate artifact"}</button>
          </section>

          {state?.hasHtml && (
            <section className="card artifact-card" aria-labelledby="artifact-heading">
              <div><p className="step">4</p><h2 id="artifact-heading">Artifact ready</h2></div>
              <p>The generated HTML is saved with this recovery session.</p>
              <div className="action-row">
                <button type="button" className="secondary" onClick={copyArtifact}>Copy HTML</button>
                <button type="button" className="primary" onClick={downloadArtifact}>Download HTML</button>
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
