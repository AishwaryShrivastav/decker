import { useState, useEffect, useCallback, useRef } from "react";
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
  TopicSelectedPayload,
  FullStateResponse,
} from "../shared/types";

const C = {
  blue: "#818cf8",     // indigo-400 (Claude brand accent)
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
  const [claudeKeyInput, setClaudeKeyInput] = useState("");
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [showTranscriptEdit, setShowTranscriptEdit] = useState(false);
  const [points, setPoints] = useState<string[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  const [topicResearch, setTopicResearch] = useState<Map<string, TopicResearch>>(new Map());
  const [customPrompt, setCustomPrompt] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("doc");
  const [micDenied, setMicDenied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isOnMeet, setIsOnMeet] = useState<boolean | null>(null);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const liveTranscriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Restore full session state when popup is opened/re-opened
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_FULL_STATE })
      .then((res) => {
        const r = res as FullStateResponse;
        if (!r) return;
        if (r.status) setStatus(r.status);
        if (r.claudeKey) setClaudeKeyInput(r.claudeKey);
        if (r.openaiKey) setOpenaiKeyInput(r.openaiKey);
        if (r.transcript) {
          setTranscript(r.transcript);
          setEditedTranscript((prev) => (prev === "" ? r.transcript! : prev));
        }
        if (r.points && r.points.length > 0) {
          setPoints(r.points);
          setSelectedPoints(new Set(r.points.map((_, i) => i)));
        }
        if (r.topicResearch && r.topicResearch.length > 0) {
          const map = new Map<string, TopicResearch>();
          r.topicResearch.forEach((tr) => map.set(tr.topic, tr));
          setTopicResearch(map);
        }
      })
      .catch(() => {});

    const handler = (message: Message) => {
      if (message.type !== MessageType.STATUS_UPDATE) return;
      const p = message.payload as StatusPayload;
      setStatus(p.status);
      setStatusMsg(p.message);
      if (p.transcript) {
        setTranscript(p.transcript);
        setEditedTranscript((prev) =>
          p.status === "recording" ? p.transcript! : prev === "" ? p.transcript! : prev
        );
      }
      if (p.points) {
        setPoints(p.points);
        // Auto-select all newly discovered points
        setSelectedPoints((prev) => {
          const next = new Set(prev);
          p.points!.forEach((_, i) => next.add(i));
          return next;
        });
      }
      if (p.topicResearch) {
        setTopicResearch((prev) => {
          const next = new Map(prev);
          p.topicResearch!.forEach((r) => next.set(r.topic, r));
          return next;
        });
      }
    };
    chrome.runtime.onMessage.addListener(handler);
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

  // When user selects a topic, trigger background research immediately
  const togglePoint = useCallback(
    (idx: number) => {
      const topic = points[idx];
      setSelectedPoints((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
          // Trigger background research for newly selected topic
          if (topic) {
            chrome.runtime.sendMessage<Message<TopicSelectedPayload>>({
              type: MessageType.TOPIC_SELECTED,
              payload: { topic },
            }).catch(() => {});
          }
        }
        return next;
      });
    },
    [points]
  );

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
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

      await chrome.runtime.sendMessage<Message<StartRecordingStreamPayload>>({
        type: MessageType.START_RECORDING_WITH_STREAM,
        payload: { tabId: tab.id, streamId },
      });
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

  const handleSaveKey = () => {
    chrome.runtime.sendMessage<Message<ApiSettings>>({
      type: MessageType.SET_API_SETTINGS,
      payload: { claudeKey: claudeKeyInput.trim(), openaiKey: openaiKeyInput.trim() },
    });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleSelectAll = useCallback(() => {
    setSelectedPoints(new Set(points.map((_, i) => i)));
    points.forEach((topic) => {
      chrome.runtime.sendMessage<Message<TopicSelectedPayload>>({
        type: MessageType.TOPIC_SELECTED,
        payload: { topic },
      }).catch(() => {});
    });
  }, [points]);

  const handleDeselectAll = useCallback(() => setSelectedPoints(new Set()), []);

  const handleGenerateDeck = () => {
    const selected = points.filter((_, i) => selectedPoints.has(i));
    const transcriptToUse = editedTranscript.trim() || transcript?.trim() || "";
    chrome.runtime.sendMessage<Message<GenerateDeckPayload>>({
      type: MessageType.GENERATE_DECK,
      payload: {
        selectedPoints: selected,
        customPrompt: customPrompt.trim(),
        transcript: transcriptToUse,
        outputFormat,
      },
    });
    setStatus(outputFormat === "prototype" ? "generating" : "researching");
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

  const transcriptToUse = editedTranscript.trim() || transcript?.trim() || "";
  const canGenerate = transcriptToUse.length >= 50;
  const allSelected = points.length > 0 && selectedPoints.size === points.length;

  const isIdle = status === "idle";
  const isRecording = status === "recording";
  const isBusy = ["processing", "finalizing", "transcribing", "extracting"].includes(status);
  const isReviewing = status === "reviewing";
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
            Claude key <span style={{ color: C.blue, fontFamily: "monospace" }}>sk-ant-…</span>
            <span style={{ color: C.muted }}> · topics, research, generation</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type={showClaudeKey ? "text" : "password"}
              value={claudeKeyInput}
              onChange={(e) => setClaudeKeyInput(e.target.value)}
              placeholder="sk-ant-api03…"
              style={{ flex: 1, padding: 7, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12 }}
            />
            <button onClick={() => setShowClaudeKey((s) => !s)} style={{ ...btn(false), width: 36, padding: 0 }}>{showClaudeKey ? "🙈" : "👁"}</button>
          </div>

          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>
            OpenAI key <span style={{ color: "#10b981", fontFamily: "monospace" }}>sk-…</span>
            <span style={{ color: C.muted }}> · Whisper audio transcription</span>
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

          <button onClick={handleSaveKey} style={{ ...btn(true), padding: "7px 12px" }}>{keySaved ? "Saved ✓" : "Save keys"}</button>
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

      {/* ── IDLE ── */}
      {isIdle && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              <button onClick={handleStart} disabled={starting} style={btn(true)}>
                {starting ? "Starting…" : "▶  Start Recording"}
              </button>
            </>
          )}
        </div>
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
                    <label key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 10px", background: selectedPoints.has(i) ? C.accentDim : C.surface2, border: `1px solid ${selectedPoints.has(i) ? C.accentBorder : C.border}`, borderRadius: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedPoints.has(i)} onChange={() => togglePoint(i)} style={{ marginTop: 2, flexShrink: 0, accentColor: C.blue }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{p}</div>
                        <ResearchPill research={research} />
                      </div>
                    </label>
                  );
                })}
              </div>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>
                Select topics to research in background. New topics appear as Claude listens.
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
        <div style={{ padding: "14px 12px", textAlign: "center", color: C.muted, fontSize: 12, background: C.surface, borderRadius: 8 }}>
          Working…
        </div>
      )}

      {/* ── GENERATING / RESEARCHING ── */}
      {isGeneratingOrResearching && (
        <div style={{ padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.dimText, marginBottom: 6 }}>{statusMsg ?? "Claude is working…"}</div>
          {points.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {points.filter((_, i) => selectedPoints.has(i)).map((p) => {
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
                    <label key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", background: selectedPoints.has(i) ? C.accentDim : C.surface2, border: `1px solid ${selectedPoints.has(i) ? C.accentBorder : C.border}`, borderRadius: 7, cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedPoints.has(i)} onChange={() => togglePoint(i)} style={{ marginTop: 2, flexShrink: 0, accentColor: C.blue }} />
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
                onChange={(e) => setEditedTranscript(e.target.value)}
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
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              style={{ width: "100%", padding: 7, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 11 }}
            >
              <option value="prototype">Static Prototype — Claude builds the app</option>
              <option value="presentation">Presentation — HTML slide deck</option>
              <option value="notes">Discussion SPA — product brief website</option>
              <option value="doc">Meeting Brief — structured document</option>
            </select>
            {outputFormat === "prototype" && (
              <p style={{ fontSize: 10, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>
                Claude builds an interactive prototype of the product you discussed. Show it live before the call ends.
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
          </div>

          {/* Custom prompt — hint changes for prototype */}
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={
              outputFormat === "prototype"
                ? "Anything specific to build? (optional — Claude decides if blank)"
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

      {/* ── DONE / ERROR ── */}
      {isDone && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: status === "error" ? C.red : C.green, marginBottom: 10, padding: 8, background: status === "error" ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)", borderRadius: 6 }}>
            {statusMsg ?? (status === "error" ? "An error occurred" : "Saved to Downloads")}
          </div>
          {status === "done" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleOpenHtml} style={{ ...btn(false), padding: "8px 12px", fontSize: 11, flex: 1 }}>Open HTML</button>
              <button onClick={handleCopyHtml} style={{ ...btn(false), padding: "8px 12px", fontSize: 11, flex: 1 }}>
                {copiedHtml ? "Copied!" : "Copy HTML"}
              </button>
            </div>
          )}
          <button
            onClick={() => { setStatus("idle"); setTranscript(null); setPoints([]); setSelectedPoints(new Set()); setTopicResearch(new Map()); setEditedTranscript(""); }}
            style={{ ...btn(false), marginTop: 8, padding: "7px 12px", fontSize: 11 }}
          >
            Start over
          </button>
        </div>
      )}

      {isIdle && isOnMeet === true && (
        <p style={{ marginTop: 10, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
          Records tab audio + mic. Topics appear live as Claude listens. Select topics to auto-research them.
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
