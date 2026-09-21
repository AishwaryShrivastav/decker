import { useState, useEffect, useRef } from "react";
import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  StartRecordingStreamPayload,
  ApiSettings,
  GenerateDeckPayload,
  OutputFormat,
  TopicResearch,
  FullStateResponse,
} from "../shared/types";

import type { TranscriptEdit } from "../shared/capture";
import { completedMilestones, getActivationState } from "../shared/activation";

const C = {
  blue: "#818cf8",     // indigo-400
  red: "#ef4444",
  green: "#34d399",
  amber: "#f59e0b",
  muted: "#64748b",
  dimText: "#94a3b8",
  text: "#e2e8f0",
  bg: "#080c18",
  surface: "#0d1224",
  surface2: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accentDim: "rgba(99,102,241,0.15)",
  accentBorder: "rgba(99,102,241,0.3)",
};

function statusText(status: RecordingStatus, msg?: string): string {
  switch (status) {
    case "idle":        return "Ready to record";
    case "recording":  return "Recording…";
    case "processing": return "Processing audio…";
    case "finalizing": return msg ?? "Preparing audio…";
    case "transcribing": return msg ?? "Transcribing…";
    case "extracting": return msg ?? "Extracting topics…";
    case "researching": return msg ?? "Researching topics…";
    case "reviewing":  return "Review & generate";
    case "generating": return msg ?? "Generating document…";
    case "done":       return msg ?? "Document ready!";
    case "error":      return msg ?? "Error";
    default:           return String(status);
  }
}

function ResearchPill({ research }: { research?: TopicResearch }) {
  if (!research || research.status === "pending") return null;

  if (research.status === "researching") {
    return (
      <span style={{ fontSize: 10, color: C.amber, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
        <span style={{ width: 8, height: 8, border: `1px solid ${C.amber}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
        Researching…
      </span>
    );
  }

  if (research.status === "done" && (research.keyInsight || research.summary)) {
    return (
      <div style={{ marginTop: 4, padding: "5px 8px", background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 5, fontSize: 10, color: C.dimText }}>
        {research.keyInsight || research.summary}
      </div>
    );
  }

  if (research.status === "error") {
    return <span style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Research unavailable</span>;
  }

  return null;
}

export function Popup() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [statusMsg, setStatusMsg] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [edit, setEdit] = useState<TranscriptEdit | undefined>();
  const [transcriptRevision, setTranscriptRevision] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const sessionIdRef = useRef('');
  const revisionRef = useRef(0);
  const [showTranscriptEdit, setShowTranscriptEdit] = useState(false);
  const [points, setPoints] = useState<string[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set());
  const [topicResearch, setTopicResearch] = useState<Map<string, TopicResearch>>(new Map());
  const [customPrompt, setCustomPrompt] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("doc");
  const [micDenied, setMicDenied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isOnMeet, setIsOnMeet] = useState<boolean | null>(null);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const liveTranscriptEndRef = useRef<HTMLDivElement>(null);

  const saveReview = (patch: { selectedPoints?: string[]; customPrompt?: string; outputFormat?: OutputFormat; edit?: TranscriptEdit }) => {
    chrome.runtime.sendMessage({ type: MessageType.SAVE_REVIEW,
      payload: { sessionId: sessionIdRef.current, ...patch } })
      .then(res => { if (res?.error) setError(res.error); })
      .catch(() => setError('Could not save review changes. Keep this popup open and copy your text.'));
  };

  useEffect(() => {
    const apply = (p: StatusPayload) => {
      if (p.sessionId && p.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = p.sessionId;
        revisionRef.current = 0;
        setEdit(undefined);
        setTranscript(null);
        setTranscriptRevision(0);
        setPoints([]);
        setSelectedPoints(new Set());
      }
      if ((p.transcriptRevision ?? 0) < revisionRef.current) return;
      setStatus(p.status);
      setStatusMsg(p.message);
      if (p.warnings) setWarnings(p.warnings);
      if (p.transcript !== undefined) setTranscript(p.transcript);
      if (p.transcriptRevision !== undefined) {
        revisionRef.current = p.transcriptRevision;
        setTranscriptRevision(p.transcriptRevision);
      }
      if (p.points) setPoints(p.points);
      if (p.selectedPoints) setSelectedPoints(new Set(p.selectedPoints));
      if (p.topicResearch) setTopicResearch(new Map(p.topicResearch.map(r => [r.topic, r])));
    };
    const handler = (message: Message) => {
      if (message.type === MessageType.STATUS_UPDATE) apply(message.payload as StatusPayload);
    };
    chrome.runtime.onMessage.addListener(handler);
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_FULL_STATE }).then((res: FullStateResponse & { error?: string }) => {
      if (res?.error) throw new Error(res.error);
      if (!res) throw new Error('Could not recover the session. Reopen Decker.');
      apply(res);
      setOpenaiKeyInput(res.openaiKey);
      if (!res.openaiKey.trim()) setShowSettings(true);
      setCustomPrompt(res.customPrompt);
      setOutputFormat(res.outputFormat);
      setEdit(res.edit);
      setHydrated(true);
    }).catch(err => setError(err instanceof Error ? err.message : String(err)));
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setIsOnMeet(!!(tab?.url?.includes("meet.google.com")));
        try {
          const perm = await navigator.permissions.query({ name: "microphone" as PermissionName });
          setMicGranted(perm.state === "granted");
        } catch {
          setMicGranted(false);
        }
      } catch {
        setIsOnMeet(false);
        setMicGranted(false);
      }
    })();
  }, []);

  useEffect(() => {
    liveTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const togglePoint = (idx: number) => {
    const topic = points[idx];
    const next = new Set(selectedPoints);
    const selecting = !next.has(topic);
    if (selecting) next.add(topic); else next.delete(topic);
    setSelectedPoints(next);
    saveReview({ selectedPoints: [...next] });
    if (selecting) chrome.runtime.sendMessage({ type: MessageType.TOPIC_SELECTED, payload: { topic } }).catch(() => {});
  };

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
      const preflight = await chrome.runtime.sendMessage({ type: MessageType.PREFLIGHT });
      if (!preflight?.ok) throw new Error(preflight?.error ?? 'Save an OpenAI key before recording.');
      setMicDenied(false);
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach((t) => t.stop());
      } catch {
        setMicDenied(true);
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab found.");
      if (!tab.url?.includes("meet.google.com")) throw new Error("Navigate to a Google Meet first.");

      const streamId = await new Promise<string>((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id! }, (id) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(id);
        });
      });

      const started = await chrome.runtime.sendMessage<Message<StartRecordingStreamPayload>>({
        type: MessageType.START_RECORDING_WITH_STREAM,
        payload: { tabId: tab.id, streamId },
      });
      if (!started?.ok) throw new Error(started?.error ?? "Audio capture did not start.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  };

  const handleStop = () => {
    chrome.runtime.sendMessage<Message>({ type: MessageType.STOP_RECORDING });
    setStatus("processing");
  };

  const handleSaveKey = async () => {
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage<Message<ApiSettings>>({
        type: MessageType.SET_API_SETTINGS,
        payload: { openaiKey: openaiKeyInput.trim() },
      });
      if (!response?.ok) throw new Error(response?.error ?? "Could not save the OpenAI key.");
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleClearKey = async () => {
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage<Message>({
        type: MessageType.CLEAR_PROVIDER_SETTINGS,
      });
      if (!response?.ok) throw new Error(response?.error ?? "Could not clear the OpenAI key.");
      setOpenaiKeyInput("");
      setKeySaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFeedback = async () => {
    const activation = await getActivationState().catch(() => null);
    const steps = completedMilestones(activation).join(", ") || "none recorded";
    const subject = encodeURIComponent("Decker first meeting feedback");
    const body = encodeURIComponent(
      `Decker version: ${chrome.runtime.getManifest().version}\n` +
      `Local activation steps: ${steps}\n\n` +
      "Was the output usable?\n\n" +
      "What did you change before sharing it?\n\n" +
      "Where did you get stuck?\n\n" +
      "Please do not include private meeting content or your API key."
    );
    chrome.tabs.create({ url: `mailto:aishwaryshrivastava@gmail.com?subject=${subject}&body=${body}` });
  };

  const handleSelectAll = () => {
    setSelectedPoints(new Set(points));
    saveReview({ selectedPoints: points });
    points.forEach(topic => {
      chrome.runtime.sendMessage({ type: MessageType.TOPIC_SELECTED, payload: { topic } }).catch(() => {});
    });
  };

  const handleDeselectAll = () => {
    setSelectedPoints(new Set());
    saveReview({ selectedPoints: [] });
  };

  const editIsCurrent = edit?.baseRevision === transcriptRevision;
  const editedTranscript = editIsCurrent ? edit!.text : transcript ?? '';
  const handleGenerateDeck = async () => {
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage<Message<GenerateDeckPayload>>({
        type: MessageType.GENERATE_DECK,
        payload: {
          sessionId: sessionIdRef.current, selectedPoints: points.filter(p => selectedPoints.has(p)),
          customPrompt: customPrompt.trim(), transcript: editedTranscript,
          transcriptRevision, transcriptEdited: editIsCurrent, outputFormat,
        },
      });
      if (!response?.ok) throw new Error(response?.error ?? 'Generation did not start.');
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  const handleReset = async () => {
    try {
      const response = await chrome.runtime.sendMessage<Message>({ type: MessageType.RESET_STATE });
      if (!response?.ok) throw new Error(response?.error ?? 'Could not reset the session.');
      window.location.reload();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  const handleOpenHtml = () => {
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_LAST_HTML }, (res: { html?: string | null }) => {
      if (res?.html) {
        const blob = new Blob([res.html], { type: "text/html" });
        chrome.tabs.create({ url: URL.createObjectURL(blob) });
      }
    });
  };

  const handleCopyHtml = () => {
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_LAST_HTML }, (res: { html?: string | null }) => {
      if (res?.html) {
        navigator.clipboard.writeText(res.html);
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      }
    });
  };

  const transcriptToUse = editedTranscript.trim();
  const canGenerate = transcriptToUse.length >= 50;
  const allSelected = points.length > 0 && selectedPoints.size === points.length;

  const isIdle = status === "idle";
  const hasOpenaiKey = openaiKeyInput.trim().length > 0;
  const isRecording = status === "recording";
  const isBusy = ["processing", "finalizing", "transcribing", "extracting"].includes(status);
  const isReviewing = hydrated && status === "reviewing";
  const isGeneratingOrResearching = ["generating", "researching"].includes(status);
  const isDone = status === "done" || status === "error";
  const showTopics = points.length > 0 && (isRecording || isReviewing);

  const btn = (primary: boolean) => ({
    width: "100%",
    padding: "10px 16px",
    background: primary ? C.blue : "transparent",
    color: primary ? C.bg : C.muted,
    border: primary ? "none" : `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700 as const,
    cursor: "pointer" as const,
  });

  return (
    <div style={{ padding: "14px 16px", minWidth: 320, maxWidth: 420, background: C.bg, minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={chrome.runtime.getURL("icons/icon48.png")} width={28} height={28} style={{ borderRadius: 6 }} alt="Decker" />
          <span style={{ fontSize: 17, fontWeight: 800, color: C.blue }}>Decker</span>
        </div>
        <button onClick={() => setShowSettings((s) => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 4 }} title="Settings">⚙</button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div style={{ marginBottom: 12, padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <button onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") })} style={{ ...btn(false), marginBottom: 12, padding: "6px 12px", fontSize: 11 }}>
            🎤 Allow microphone
          </button>

          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>
            OpenAI key <span style={{ color: "#10b981", fontFamily: "monospace" }}>sk-…</span>
            <span style={{ color: C.muted }}> · transcription, topics, research, generation</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type={showOpenaiKey ? "text" : "password"}
              value={openaiKeyInput}
              onChange={(e) => setOpenaiKeyInput(e.target.value)}
              placeholder="sk-proj-…"
              style={{ flex: 1, padding: 7, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12 }}
            />
            <button onClick={() => setShowOpenaiKey((s) => !s)} style={{ ...btn(false), width: 36, padding: 0 }}>{showOpenaiKey ? "🙈" : "👁"}</button>
          </div>

          <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
            Your key is saved in local extension storage and sent to OpenAI to authenticate requests.
            Local debug logs can contain topic text and API errors. The developer receives no automatic telemetry.
            Use Clear key to remove the saved credential. Uninstall to remove local logs; downloaded files remain.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={!hasOpenaiKey} onClick={handleSaveKey} style={{ ...btn(true), padding: "7px 12px", opacity: hasOpenaiKey ? 1 : 0.5 }}>{keySaved ? "Saved ✓" : "Save key"}</button>
            <button onClick={handleClearKey} style={{ ...btn(false), padding: "7px 12px" }}>Clear key</button>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div style={{
        fontSize: 12,
        color: isRecording ? C.red : isBusy || isGeneratingOrResearching ? C.amber : isDone ? (status === "error" ? C.red : C.green) : C.muted,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        {isRecording && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite", flexShrink: 0 }} />}
        {(isBusy || isGeneratingOrResearching) && <span style={{ width: 11, height: 11, border: `2px solid ${C.amber}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />}
        <span>{statusText(status, statusMsg)}</span>
      </div>

      {error && <div style={{ fontSize: 11, color: C.red, marginBottom: 10, padding: 8, background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>{error}</div>}

      {warnings.length > 0 && (
        <div role="alert" style={{ fontSize: 11, color: C.amber, marginBottom: 10, padding: 8, background: C.surface, borderRadius: 6 }}>
          <strong>Capture warnings</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>{warnings.map(w => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      {edit && !editIsCurrent && <p role="alert" style={{ color: C.amber, fontSize: 11 }}>New transcript segments arrived after your edit. The complete transcript is shown below; review it before generating.</p>}

      {/* ── IDLE ── */}
      {isIdle && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: 10, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 7 }}>Ready for the first meeting?</div>
            <div style={{ display: "grid", gap: 5, fontSize: 11 }}>
              <span style={{ color: hasOpenaiKey ? C.green : C.amber }}>{hasOpenaiKey ? "1. OpenAI key saved" : "1. Add an OpenAI key in Settings"}</span>
              <span style={{ color: isOnMeet ? C.green : C.muted }}>{isOnMeet ? "2. Google Meet tab ready" : "2. Open a Google Meet tab"}</span>
              <span style={{ color: micGranted ? C.green : C.muted }}>{micGranted ? "3. Microphone allowed" : "3. Allow the microphone if you want your voice captured"}</span>
            </div>
            {!hasOpenaiKey && (
              <button onClick={() => setShowSettings(true)} style={{ ...btn(false), marginTop: 9, padding: "7px 10px", fontSize: 11 }}>
                Add OpenAI key
              </button>
            )}
            {isOnMeet === false && (
              <button onClick={() => chrome.tabs.create({ url: "https://meet.new" })} style={{ ...btn(false), marginTop: 9, padding: "7px 10px", fontSize: 11 }}>
                Open a test meeting
              </button>
            )}
          </div>
          {isOnMeet === false && (
            <div style={{ padding: 10, background: C.surface, borderRadius: 8, fontSize: 12, color: C.amber, border: `1px solid ${C.border}` }}>
              Open a <strong>Google Meet</strong> tab first.
            </div>
          )}
          {(isOnMeet === true || isOnMeet === null) && (
            <>
              {isOnMeet === true && (
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.muted }}>
                  <span style={{ color: C.green }}>✓ Meet tab</span>
                  {micGranted === true && <span style={{ color: C.green }}>✓ Mic</span>}
                  {micGranted === false && <span style={{ color: C.amber }}>⚠ Mic not allowed</span>}
                </div>
              )}
              {micGranted === false && (
                <button onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") })} style={btn(false)}>
                  🎤 Allow microphone
                </button>
              )}
              <p style={{ margin: 0, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                Start Recording sends Meet audio and your microphone, when available, directly to OpenAI
                for transcription using your key. Transcript content, selected topics, and instructions
                also go to OpenAI for summaries and generation. API charges apply.
                The developer does not receive these requests. Obtain any required participant consent.
                One recovery session, including pending audio and transcript content, is stored locally in IndexedDB.
                {" "}<a href="https://decker.techforgood.studio/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>Privacy policy</a>
              </p>
              <button onClick={handleStart} disabled={starting || !hydrated || !hasOpenaiKey} style={{ ...btn(true), opacity: hasOpenaiKey ? 1 : 0.55 }}>
                {starting ? "Starting…" : "▶  Start Recording"}
              </button>
            </>
          )}
        </div>
      )}

      {/* HTML may include resources or code supplied by the model. */}
      {(isReviewing || status === "done") && (
        <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
          Generated HTML is saved to Downloads and can load external resources or run code when opened.
          Review it before opening or sharing. Copy HTML writes the output to your clipboard.
        </p>
      )}

      {/* ── RECORDING ── */}
      {isRecording && (
        <div>
          {/* Live topics — show as they're discovered */}
          {showTopics && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>Topics discovered</span>
                <button onClick={allSelected ? handleDeselectAll : handleSelectAll} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 11 }}>
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {points.map((p, i) => {
                  const research = topicResearch.get(p);
                  return (
                    <label key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 10px", background: selectedPoints.has(p) ? C.accentDim : C.surface2, border: `1px solid ${selectedPoints.has(p) ? C.accentBorder : C.border}`, borderRadius: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedPoints.has(p)} onChange={() => togglePoint(i)} style={{ marginTop: 2, flexShrink: 0, accentColor: C.blue }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{p}</div>
                        <ResearchPill research={research} />
                      </div>
                    </label>
                  );
                })}
              </div>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>
                Select topics to research in background. New topics appear as Decker listens.
              </p>
            </div>
          )}

          {/* Live transcript toggle */}
          {transcript && transcript.trim().length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={() => setShowTranscriptEdit((s) => !s)}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: 0 }}
              >
                {showTranscriptEdit ? "▲ Hide" : "▼ Show"} transcript ({transcript.split(" ").filter(Boolean).length} words)
              </button>
              {showTranscriptEdit && (
                <div style={{ marginTop: 6, maxHeight: 140, overflowY: "auto", padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.dimText, fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {transcript}
                  <div ref={liveTranscriptEndRef} />
                </div>
              )}
            </div>
          )}

          <button onClick={handleStop} style={{ ...btn(true), background: C.red, color: "#fff" }}>
            ■  Stop & Transcribe
          </button>
          {micDenied && (
            <p style={{ marginTop: 8, fontSize: 10, color: C.amber }}>
              Tab audio only.{" "}
              <button onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") })} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 10 }}>
                Allow mic
              </button>{" "}
              to capture your voice.
            </p>
          )}
        </div>
      )}

      {/* ── BUSY (processing/transcribing/extracting) ── */}
      {isBusy && (
        <div style={{ padding: "14px 12px", textAlign: "center", color: C.dimText, fontSize: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
          {statusMsg ?? statusText(status)}
        </div>
      )}

      {/* ── GENERATING / RESEARCHING ── */}
      {isGeneratingOrResearching && (
        <div style={{ padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.dimText, marginBottom: 6 }}>{statusMsg ?? "Working…"}</div>
          {points.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {points.filter(p => selectedPoints.has(p)).map((p) => {
                const r = topicResearch.get(p);
                const isDone = r?.status === "done";
                const isWorking = r?.status === "researching";
                return (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                    {isDone ? (
                      <span style={{ color: C.green }}>✓</span>
                    ) : isWorking ? (
                      <span style={{ width: 8, height: 8, border: `1px solid ${C.amber}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.border, flexShrink: 0 }} />
                    )}
                    <span style={{ color: isDone ? C.dimText : C.muted }}>{p}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── REVIEWING ── */}
      {isReviewing && (
        <div style={{ marginTop: 4 }}>
          {statusMsg && <p role="alert" style={{ color: C.amber, fontSize: 11 }}>{statusMsg}</p>}
          {(transcript?.trim()?.length ?? 0) < 50 && points.length === 0 && (
            <div style={{ fontSize: 11, color: C.amber, marginBottom: 10, padding: 8, background: C.surface, borderRadius: 6 }}>
              Transcript too short. Paste or type your meeting transcript below.
            </div>
          )}

          {/* Topics with research */}
          {points.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>Topics ({points.length})</span>
                <button onClick={allSelected ? handleDeselectAll : handleSelectAll} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 11 }}>
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {points.map((p, i) => {
                  const research = topicResearch.get(p);
                  return (
                    <label key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", background: selectedPoints.has(p) ? C.accentDim : C.surface2, border: `1px solid ${selectedPoints.has(p) ? C.accentBorder : C.border}`, borderRadius: 7, cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedPoints.has(p)} onChange={() => togglePoint(i)} style={{ marginTop: 2, flexShrink: 0, accentColor: C.blue }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4, fontWeight: 500 }}>{p}</div>
                        <ResearchPill research={research} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transcript (collapsed by default) */}
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setShowTranscriptEdit((s) => !s)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, padding: 0, marginBottom: 4 }}>
              {showTranscriptEdit ? "▲ Hide" : "▼ Edit"} transcript
            </button>
            {showTranscriptEdit && (
              <textarea
                value={editedTranscript}
                onChange={(e) => {
                  const next = { text: e.target.value, baseRevision: transcriptRevision };
                  setEdit(next);
                  saveReview({ edit: next });
                }}
                placeholder={transcript || "Paste or type your meeting transcript…"}
                rows={6}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, resize: "vertical" }}
              />
            )}
          </div>

          {/* Output format */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>Output</label>
            <select
              value={outputFormat}
              onChange={(e) => {
                const next = e.target.value as OutputFormat;
                setOutputFormat(next);
                saveReview({ outputFormat: next });
              }}
              style={{ width: "100%", padding: 7, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11 }}
            >
              <option value="prototype">Static Prototype — AI builds the app</option>
              <option value="presentation">Presentation — HTML slide deck</option>
              <option value="notes">Discussion SPA — product brief website</option>
              <option value="doc">Meeting Brief — structured document</option>
            </select>
            {outputFormat === "prototype" && (
              <p style={{ fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>
                Decker generates an HTML prototype from the discussion. Review it before opening or sharing.
              </p>
            )}
            {outputFormat === "presentation" && (
              <p style={{ fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>
                A beautiful HTML slide deck — click or arrow-key to navigate. Share in chat as a single file.
              </p>
            )}
            {outputFormat === "notes" && (
              <p style={{ fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>
                A full website covering everything discussed — hero, sections, insights. Not notes, a brief.
              </p>
            )}
            {outputFormat === "doc" && (
              <p style={{ fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>
                Structured document with per-topic summaries, key decisions, and an action items table.
              </p>
            )}
          </div>

          {/* Custom prompt — hint changes for prototype */}
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              saveReview({ customPrompt: e.target.value });
            }}
            placeholder={
              outputFormat === "prototype"
                ? "Anything specific to build? (optional — the model decides if blank)"
                : "Custom instructions (optional)"
            }
            rows={2}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11, marginBottom: 10, resize: "vertical" }}
          />

          <button onClick={handleGenerateDeck} disabled={!canGenerate} style={{ ...btn(true), opacity: canGenerate ? 1 : 0.5 }}>
            {outputFormat === "prototype" ? "Build Prototype"
              : outputFormat === "presentation" ? "Build Presentation"
              : outputFormat === "notes" ? "Build Discussion Site"
              : "Generate Brief"}
            {selectedPoints.size > 0 ? ` (${selectedPoints.size} topics)` : ""}
          </button>
          {!canGenerate && transcriptToUse.length > 0 && (
            <div style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>Need 50+ chars to generate</div>
          )}
        </div>
      )}

      {transcript && !isRecording && !isBusy && (
        <button onClick={() => navigator.clipboard.writeText([editedTranscript, ...warnings].join('\n\n')).catch(() => setError('Could not copy transcript. Select and copy it from the transcript field.'))}
          style={{ ...btn(false), marginTop: 8, fontSize: 11 }}>Copy transcript</button>
      )}

      {isReviewing && (
        <button onClick={handleReset} style={{ ...btn(false), marginTop: 8, fontSize: 11 }}>Discard session & start over</button>
      )}

      {/* ── DONE / ERROR ── */}
      {isDone && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: status === "error" ? C.red : C.green, marginBottom: 10, padding: 8, background: status === "error" ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)", borderRadius: 6 }}>
            {statusMsg ?? (status === "error" ? "An error occurred" : "Saved to Downloads")}
          </div>
          {status === "done" && (
            <div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleOpenHtml} style={{ ...btn(false), padding: "8px 12px", fontSize: 11, flex: 1 }}>Open HTML</button>
                <button onClick={handleCopyHtml} style={{ ...btn(false), padding: "8px 12px", fontSize: 11, flex: 1 }}>
                  {copiedHtml ? "Copied" : "Copy HTML"}
                </button>
              </div>
              <button onClick={handleFeedback} style={{ ...btn(false), marginTop: 8, padding: "8px 12px", fontSize: 11 }}>
                Share first-meeting feedback
              </button>
            </div>
          )}
          <button
            onClick={handleReset}
            style={{ ...btn(false), marginTop: 8, padding: "7px 12px", fontSize: 11 }}
          >
            Start over
          </button>
        </div>
      )}

      {isIdle && isOnMeet === true && (
        <p style={{ marginTop: 10, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
          Records tab audio + mic. Topics appear live as Decker listens. Select topics to auto-research them.
        </p>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
