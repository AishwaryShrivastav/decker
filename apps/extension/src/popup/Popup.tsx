import { useState, useEffect, useCallback } from "react";
import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  StartRecordingStreamPayload,
  ApiSettings,
  GenerateDeckPayload,
} from "../shared/types";

const C = {
  blue: "#2496ED",
  red: "#ef4444",
  green: "#10b981",
  amber: "#f59e0b",
  muted: "#9ca3af",
  bg: "#1a1a2e",
  surface: "#252540",
  border: "#3a3a5c",
};

function statusText(status: RecordingStatus, msg?: string): string {
  switch (status) {
    case "idle": return "Ready to record";
    case "recording": return "Recording…";
    case "processing": return "Processing audio…";
    case "finalizing": return msg ?? "Preparing audio…";
    case "transcribing": return msg ?? "Transcribing…";
    case "extracting": return msg ?? "Extracting points…";
    case "reviewing": return "Review & generate";
    case "generating": return msg ?? "Generating deck…";
    case "done": return msg ?? "Deck ready!";
    case "error": return msg ?? "Error";
    default: return String(status);
  }
}

export function Popup() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [statusMsg, setStatusMsg] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [editedTranscript, setEditedTranscript] = useState(""); // user can paste/fix when Whisper returns poor result
  const [points, setPoints] = useState<string[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  const [customPrompt, setCustomPrompt] = useState("");
  const [backgroundColor, setBackgroundColor] = useState<string>("dark");
  const [micDenied, setMicDenied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isOnMeet, setIsOnMeet] = useState<boolean | null>(null);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_STATUS })
      .then((res) => {
        const r = res as { status: RecordingStatus };
        if (r?.status) setStatus(r.status);
      })
      .catch(() => {});

    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_API_SETTINGS })
      .then((res) => {
        const r = res as ApiSettings;
        if (r?.apiKey) setApiKeyInput(r.apiKey);
      })
      .catch(() => {});

    const handler = (message: Message) => {
      if (message.type === MessageType.STATUS_UPDATE) {
        const p = message.payload as StatusPayload;
        setStatus(p.status);
        setStatusMsg(p.message);
        if (p.transcript) {
          setTranscript(p.transcript);
          setEditedTranscript((prev) => (prev === "" ? p.transcript! : prev)); // only auto-fill editedTranscript if empty
        }
        if (p.points) {
          setPoints(p.points);
          setSelectedPoints(new Set(p.points.map((_, i) => i)));
        }
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // Detect Meet tab and mic permission when popup opens
  useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const onMeet = !!(tab?.url?.includes("meet.google.com"));
        setIsOnMeet(onMeet);

        let granted = false;
        try {
          const perm = await navigator.permissions.query({ name: "microphone" as PermissionName });
          granted = perm.state === "granted";
        } catch {
          /* Permissions API may not support microphone */
        }
        setMicGranted(granted);
      } catch {
        setIsOnMeet(false);
        setMicGranted(false);
      }
    })();
  }, []);

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
      // Request mic FIRST while user gesture is active (before any awaits).
      setMicDenied(false);
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach((t) => t.stop());
      } catch (micErr) {
        console.warn("Mic permission denied, will record tab only:", micErr);
        setMicDenied(true);
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab found.");
      if (!tab.url?.includes("meet.google.com")) {
        throw new Error("Navigate to a Google Meet first.");
      }

      const streamId = await new Promise<string>((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id! }, (id) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(id);
          }
        });
      });

      await chrome.runtime.sendMessage<Message<StartRecordingStreamPayload>>({
        type: MessageType.START_RECORDING_WITH_STREAM,
        payload: { tabId: tab.id, streamId },
      });

      // Keep popup open so user can click Stop
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
      payload: { apiKey: apiKeyInput.trim() },
    });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleSelectAll = useCallback(() => {
    setSelectedPoints(new Set(points.map((_, i) => i)));
  }, [points]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPoints(new Set());
  }, []);

  const togglePoint = (idx: number) => {
    setSelectedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleGenerateDeck = () => {
    const selected = points.filter((_, i) => selectedPoints.has(i));
    const transcriptToUse = editedTranscript.trim() || transcript?.trim() || "";
    chrome.runtime.sendMessage<Message<GenerateDeckPayload>>({
      type: MessageType.GENERATE_DECK,
      payload: {
        selectedPoints: selected,
        customPrompt: customPrompt.trim(),
        transcript: transcriptToUse,
        backgroundColor: backgroundColor !== "dark" ? backgroundColor : undefined,
      },
    });
    setStatus("generating");
  };

  const handleOpenHtml = () => {
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_LAST_HTML }, (res: { html?: string | null }) => {
      if (res?.html) {
        const blob = new Blob([res.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        chrome.tabs.create({ url });
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

  const isIdle = status === "idle";
  const isRecording = status === "recording";
  const isBusy = ["processing", "finalizing", "transcribing", "extracting"].includes(status);
  const isReviewing = status === "reviewing";
  const isGenerating = status === "generating";
  const isDone = status === "done" || status === "error";
  const allSelected = points.length > 0 && selectedPoints.size === points.length;

  const btn = (primary: boolean) => ({
    width: "100%",
    padding: "10px 16px",
    background: primary ? C.blue : "transparent",
    color: primary ? "#fff" : C.muted,
    border: primary ? "none" : `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <div style={{ padding: "14px 16px", minWidth: 280, maxWidth: 360, maxHeight: 520, overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill={C.blue} />
            <ellipse cx="16" cy="18" rx="9" ry="6" fill="white" />
            <path d="M7 18 Q4 15 5 12 Q6 15 7 14" fill="white" />
            <path d="M18 12 Q19 9 20 10 Q19 11 20 12" stroke="white" strokeWidth="1.5" fill="none" />
            <rect x="11" y="14" width="4" height="3" rx="0.5" fill={C.blue} />
            <rect x="16" y="14" width="4" height="3" rx="0.5" fill={C.blue} />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>Decker</span>
        </div>
        <button
          onClick={() => setShowSettings((s) => !s)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 4 }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div style={{ marginBottom: 12, padding: 12, background: C.surface, borderRadius: 8 }}>
          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") })}
            style={{ ...btn(false), marginBottom: 12, padding: "6px 12px", fontSize: 11 }}
          >
            🎤 Allow microphone
          </button>
          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>API Key</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              style={{ flex: 1, padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: "#fff", fontSize: 12 }}
            />
            <button onClick={() => setShowKey((s) => !s)} style={{ ...btn(false), width: 36 }}>{showKey ? "🙈" : "👁"}</button>
          </div>
          <button onClick={handleSaveKey} style={{ ...btn(false), marginTop: 8, padding: "6px 12px" }}>
            {keySaved ? "Saved ✓" : "Save"}
          </button>
        </div>
      )}

      {/* Status */}
      <div style={{ fontSize: 12, color: isRecording ? C.red : isBusy ? C.amber : isDone ? C.green : C.muted, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        {isRecording && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, animation: "pulse 1.2s infinite" }} />}
        {(isBusy || isGenerating) && <span style={{ width: 12, height: 12, border: `2px solid ${C.amber}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
        {statusText(status, statusMsg)}
      </div>

      {error && <div style={{ fontSize: 11, color: C.red, marginBottom: 10 }}>{error}</div>}

      {/* Idle: contextual based on Meet tab + mic permission */}
      {isIdle && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isOnMeet === false && (
            <div style={{ padding: 10, background: C.surface, borderRadius: 8, fontSize: 12, color: C.amber }}>
              Open a <strong>Google Meet</strong> tab first, then click Decker.
            </div>
          )}
          {isOnMeet === true && (
            <>
              <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.muted }}>
                <span style={{ color: C.green }}>✓ Meet</span>
                {micGranted === true ? (
                  <span style={{ color: C.green }}>✓ Mic granted</span>
                ) : micGranted === false ? (
                  <span style={{ color: C.amber }}>Mic not allowed</span>
                ) : null}
              </div>
              {micGranted === false && (
                <button
                  onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") })}
                  style={{ ...btn(false), border: `1px solid ${C.border}` }}
                >
                  🎤 Allow microphone
                </button>
              )}
              <button onClick={handleStart} disabled={starting} style={{ ...btn(true) }}>
                {starting ? "Starting…" : "▶  Start Recording"}
              </button>
            </>
          )}
          {isOnMeet === null && (
            <>
              <button
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") })}
                style={{ ...btn(false), border: `1px solid ${C.border}` }}
              >
                🎤 Allow microphone
              </button>
              <button onClick={handleStart} disabled={starting} style={{ ...btn(true) }}>
                {starting ? "Starting…" : "▶  Start Recording"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Recording: Stop */}
      {isRecording && (
        <>
          <button onClick={handleStop} style={{ ...btn(true), background: C.red }}>
            Stop & Transcribe
          </button>
          {micDenied && (
            <p style={{ marginTop: 8, fontSize: 10, color: C.amber }}>
              Tab only.{" "}
              <button
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") })}
                style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 10 }}
              >
                Allow microphone
              </button>{" "}
              to record your voice.
            </p>
          )}
        </>
      )}

      {/* Processing */}
      {(isBusy || isGenerating) && (
        <div style={{ padding: 12, textAlign: "center", color: C.muted, fontSize: 12 }}>Working…</div>
      )}

      {/* Review: transcript, points, generate */}
      {isReviewing && (
        <div style={{ marginTop: 8 }}>
          {(transcript?.trim()?.length ?? 0) < 50 && points.length === 0 && (
            <div style={{ fontSize: 11, color: C.amber, marginBottom: 10 }}>
              Transcript too short for AI to extract points. Paste or type your transcript below to generate.
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Transcript</label>
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              placeholder={transcript || "Paste or type your meeting transcript here…"}
              rows={4}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: "#fff", fontSize: 11, resize: "vertical", boxSizing: "border-box" }}
            />
            {transcript && editedTranscript !== transcript && (
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Editable — use your transcript if Whisper missed content</div>
            )}
          </div>

          {points.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>Points</span>
                <button onClick={allSelected ? handleDeselectAll : handleSelectAll} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 11 }}>
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div style={{ maxHeight: 120, overflowY: "auto" }}>
                {points.map((p, i) => (
                  <label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6, fontSize: 11, cursor: "pointer" }}>
                    <input type="checkbox" checked={selectedPoints.has(i)} onChange={() => togglePoint(i)} />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Slide background</label>
            <select
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: "#fff", fontSize: 11 }}
            >
              <option value="dark">Dark</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="light">Light</option>
            </select>
          </div>

          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Custom instructions (optional)"
            rows={2}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: "#fff", fontSize: 11, marginBottom: 12, resize: "vertical" }}
          />

          <button
            onClick={handleGenerateDeck}
            disabled={!canGenerate}
            style={{ ...btn(true), opacity: canGenerate ? 1 : 0.5 }}
          >
            Generate Deck {points.length > 0 ? `(${selectedPoints.size} points)` : "(from transcript)"}
          </button>
          {!canGenerate && transcriptToUse.length > 0 && (
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Need 50+ characters to generate</div>
          )}
        </div>
      )}

      {/* Done / Error */}
      {isDone && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: status === "error" ? C.red : C.green, marginBottom: 10 }}>
            {statusMsg ?? (status === "error" ? "An error occurred" : "Deck saved to Downloads")}
          </div>
          {status === "done" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={handleOpenHtml} style={{ ...btn(false), padding: "8px 12px", fontSize: 11 }}>
                Open HTML
              </button>
              <button onClick={handleCopyHtml} style={{ ...btn(false), padding: "8px 12px", fontSize: 11 }}>
                {copiedHtml ? "Copied!" : "Copy HTML"}
              </button>
            </div>
          )}
        </div>
      )}

      {isIdle && isOnMeet === true && (
        <p style={{ marginTop: 12, fontSize: 10, color: C.muted }}>
          Records tab (others) + mic (you). All controls are in this popup.
        </p>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
