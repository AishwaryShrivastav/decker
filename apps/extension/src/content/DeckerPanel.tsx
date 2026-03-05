import { useState, useEffect, useCallback } from "react";
import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  ApiSettings,
  GenerateDeckPayload,
} from "../shared/types";
// START_RECORDING moved to popup (requires extension invocation via toolbar click)

interface Props {
  initialStatus: RecordingStatus;
}

function statusLabel(status: RecordingStatus, message?: string): string {
  switch (status) {
    case "idle":
      return "Ready to record";
    case "recording":
      return "Recording…";
    case "processing":
      return "Processing audio…";
    case "finalizing":
      return message ?? "Preparing audio…";
    case "transcribing":
      return message ?? "Transcribing…";
    case "extracting":
      return message ?? "Extracting discussion points…";
    case "reviewing":
      return "Review & customise your deck";
    case "generating":
      return message ?? "Generating deck…";
    case "done":
      return message ?? "Deck ready! Check Downloads.";
    case "error":
      return `Error: ${message ?? "Unknown error"}`;
  }
}

export function DeckerPanel({ initialStatus }: Props) {
  const [status, setStatus] = useState<RecordingStatus>(initialStatus);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Review phase
  const [transcript, setTranscript] = useState<string | null>(null);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [points, setPoints] = useState<string[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  const [customPrompt, setCustomPrompt] = useState("");

  // Load saved API key on mount
  useEffect(() => {
    chrome.runtime.sendMessage<Message>(
      { type: MessageType.GET_API_SETTINGS },
      (resp: ApiSettings) => {
        if (resp?.apiKey) setApiKeyInput(resp.apiKey);
      }
    );
  }, []);

  // Listen for status updates from background
  useEffect(() => {
    const handler = (message: Message) => {
      if (message.type === MessageType.STATUS_UPDATE) {
        const payload = message.payload as StatusPayload;
        console.log("[Decker panel] Status update:", payload.status, payload.message ?? "");
        setStatus(payload.status);
        setStatusMessage(payload.message);
        if (payload.transcript) {
          setTranscript(payload.transcript);
          setEditedTranscript((prev) => (prev === "" ? payload.transcript! : prev));
        }
        if (payload.points) {
          setPoints(payload.points);
          setSelectedPoints(new Set(payload.points.map((_, i) => i)));
        }
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const handleSaveKey = () => {
    chrome.runtime.sendMessage<Message<ApiSettings>>({
      type: MessageType.SET_API_SETTINGS,
      payload: { apiKey: apiKeyInput.trim() },
    });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleShowDebugLog = () => {
    setShowDebugLog((s) => !s);
    if (!showDebugLog) {
      chrome.runtime.sendMessage({ type: MessageType.GET_DEBUG_LOG }, (r: { log?: string[] }) => {
        setDebugLog(r?.log ?? []);
      });
    }
  };

  const refreshDebugLog = () => {
    chrome.runtime.sendMessage({ type: MessageType.GET_DEBUG_LOG }, (r: { log?: string[] }) => {
      setDebugLog(r?.log ?? []);
    });
  };

  const handleStop = () => {
    chrome.runtime.sendMessage<Message>({ type: MessageType.STOP_RECORDING });
    setStatus("processing");
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
      },
    });
    setStatus("generating");
  };

  const transcriptToUse = editedTranscript.trim() || transcript?.trim() || "";
  const canGenerate = transcriptToUse.length >= 50;

  const isRecording = status === "recording";
  const isProcessing = ["processing", "finalizing", "transcribing", "extracting"].includes(status);
  const isReviewing = status === "reviewing";
  const isGenerating = status === "generating";
  const isDone = status === "done" || status === "error";
  const allSelected = points.length > 0 && selectedPoints.size === points.length;

  return (
    <div className="decker-panel">
      {/* Header */}
      <div className="decker-header">
        <span className="decker-logo">Decker</span>
        <button
          className={`decker-gear ${showSettings ? "active" : ""}`}
          onClick={() => setShowSettings((s) => !s)}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* Settings drawer */}
      {showSettings && (
        <div className="decker-settings">
          <label className="decker-label">API Key</label>
          <div className="decker-key-row">
            <input
              type={showKey ? "text" : "password"}
              className="decker-input"
              placeholder="sk-... or sk-ant-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              spellCheck={false}
            />
            <button className="decker-eye" onClick={() => setShowKey((s) => !s)}>
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
          <button className="decker-btn decker-btn-save" onClick={handleSaveKey}>
            {keySaved ? "Saved ✓" : "Save"}
          </button>
          <p className="decker-hint">OpenAI (sk-…) or Anthropic (sk-ant-…)</p>

          <div className="decker-section" style={{ marginTop: 16 }}>
            <button
              className="decker-collapsible"
              onClick={handleShowDebugLog}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left", color: "inherit" }}
            >
              <span className="decker-label">Recent logs</span>
              <span>{showDebugLog ? " ▲" : " ▼"}</span>
            </button>
            {showDebugLog && (
              <div style={{ marginTop: 8 }}>
                <button className="decker-link" onClick={refreshDebugLog} style={{ marginBottom: 8 }}>
                  Refresh
                </button>
                <pre
                  className="decker-transcript"
                  style={{ fontSize: "10px", maxHeight: 150, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                >
                  {debugLog.length === 0 ? "No logs yet. Record and stop to see events." : debugLog.join("\n")}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status bar */}
      {!isReviewing && (
        <div className={`decker-status ${status}`}>
          {isRecording && <span className="decker-dot" />}
          {(isProcessing || isGenerating) && <span className="decker-spinner" />}
          {statusLabel(status, statusMessage)}
        </div>
      )}

      {/* Idle — prompt user to click the toolbar icon */}
      {status === "idle" && (
        <div className="decker-idle-hint">
          <span className="decker-hint-icon">▶</span>
          Click the <strong>Decker icon</strong> in your toolbar to start recording
        </div>
      )}

      {/* Done / Error */}
      {isDone && (
        <>
          {status === "error" && (
            <div className="decker-status error" style={{ marginBottom: "10px" }}>
              {statusLabel(status, statusMessage)}
            </div>
          )}
          {status === "done" && (
            <div className="decker-status done" style={{ marginBottom: "10px" }}>
              {statusLabel(status, statusMessage)}
            </div>
          )}
          <div className="decker-idle-hint">
            <span className="decker-hint-icon">▶</span>
            Click the <strong>Decker icon</strong> in the toolbar to record again
          </div>
        </>
      )}

      {/* Recording action */}
      {isRecording && (
        <button className="decker-btn decker-btn-stop" onClick={handleStop}>
          Stop &amp; Transcribe
        </button>
      )}

      {/* Processing spinner */}
      {(isProcessing || isGenerating) && (
        <button className="decker-btn decker-btn-processing" disabled>
          Working…
        </button>
      )}

      {/* Review phase */}
      {isReviewing && (
        <div className="decker-review">
          <div className="decker-status reviewing">
            {statusLabel("reviewing")}
          </div>

          {(transcript?.trim()?.length ?? 0) < 50 && points.length === 0 && (
            <div className="decker-status" style={{ marginBottom: "10px", color: "var(--decker-amber, #f59e0b)" }}>
              Transcript too short. Paste or edit your transcript below to generate.
            </div>
          )}

          {/* Transcript (editable when short) */}
          <div className="decker-section">
            <label className="decker-label">Transcript</label>
            <textarea
              className="decker-textarea"
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              placeholder={transcript || "Paste or type your meeting transcript…"}
              rows={4}
            />
          </div>

          {/* Discussion points */}
          {points.length > 0 && (
            <div className="decker-section">
              <div className="decker-points-header">
                <span className="decker-label">Discussion points</span>
                <button
                  className="decker-link"
                  onClick={allSelected ? handleDeselectAll : handleSelectAll}
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="decker-points">
                {points.map((point, idx) => (
                  <label key={idx} className="decker-point">
                    <input
                      type="checkbox"
                      checked={selectedPoints.has(idx)}
                      onChange={() => togglePoint(idx)}
                    />
                    <span>{point}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom instructions */}
          <div className="decker-section">
            <label className="decker-label">Custom instructions</label>
            <textarea
              className="decker-textarea"
              placeholder="e.g. Focus on action items, use formal tone…"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate button */}
          <button
            className="decker-btn decker-btn-generate"
            onClick={handleGenerateDeck}
            disabled={!canGenerate}
          >
            Generate Deck {points.length > 0 ? `(${selectedPoints.size} point${selectedPoints.size !== 1 ? "s" : ""})` : "(from transcript)"}
          </button>
          {!canGenerate && transcriptToUse.length > 0 && (
            <div className="decker-hint" style={{ marginTop: 6 }}>Need 50+ characters</div>
          )}
        </div>
      )}
    </div>
  );
}
