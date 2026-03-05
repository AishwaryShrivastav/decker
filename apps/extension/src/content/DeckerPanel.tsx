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

  // Review phase
  const [transcript, setTranscript] = useState<string | null>(null);
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
        setStatus(payload.status);
        setStatusMessage(payload.message);
        if (payload.transcript) setTranscript(payload.transcript);
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
    const payload: GenerateDeckPayload = {
      selectedPoints: selected,
      customPrompt: customPrompt.trim(),
    };
    chrome.runtime.sendMessage<Message<GenerateDeckPayload>>({
      type: MessageType.GENERATE_DECK,
      payload,
    });
    setStatus("generating");
  };

  const isRecording = status === "recording";
  const isProcessing = ["processing", "transcribing", "extracting"].includes(status);
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

          {/* Transcript collapsible */}
          {transcript && (
            <div className="decker-section">
              <button
                className="decker-collapsible"
                onClick={() => setShowTranscript((s) => !s)}
              >
                <span>Transcript</span>
                <span>{showTranscript ? "▲" : "▼"}</span>
              </button>
              {showTranscript && (
                <div className="decker-transcript">{transcript}</div>
              )}
            </div>
          )}

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
            disabled={selectedPoints.size === 0}
          >
            Generate Deck ({selectedPoints.size} point{selectedPoints.size !== 1 ? "s" : ""})
          </button>
        </div>
      )}
    </div>
  );
}
