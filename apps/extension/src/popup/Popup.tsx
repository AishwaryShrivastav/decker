import { useState, useEffect } from "react";
import {
  Message,
  MessageType,
  RecordingStatus,
  StatusPayload,
  StartRecordingStreamPayload,
} from "../shared/types";

function statusText(status: RecordingStatus, msg?: string): string {
  switch (status) {
    case "idle":       return "Ready to record";
    case "recording":  return "Recording in progress…";
    case "processing": return "Processing audio…";
    case "transcribing": return msg ?? "Transcribing audio…";
    case "extracting": return msg ?? "Extracting points…";
    case "reviewing":  return "Reviewing in Meet tab";
    case "generating": return msg ?? "Generating deck…";
    case "done":       return msg ?? "Deck ready!";
    case "error":      return msg ?? "An error occurred";
  }
}

export function Popup() {
  const [status, setStatus]     = useState<RecordingStatus>("idle");
  const [statusMsg, setStatusMsg] = useState<string | undefined>();
  const [error, setError]       = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    chrome.runtime
      .sendMessage<Message>({ type: MessageType.GET_STATUS })
      .then((res) => {
        const r = res as { status: RecordingStatus };
        if (r?.status) setStatus(r.status);
      })
      .catch(() => {});

    const handler = (message: Message) => {
      if (message.type === MessageType.STATUS_UPDATE) {
        const p = message.payload as StatusPayload;
        setStatus(p.status);
        setStatusMsg(p.message);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
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

      window.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStarting(false);
    }
  };

  const isIdle = status === "idle";
  const isRecording = status === "recording";
  const isBusy = ["processing", "transcribing", "extracting", "generating"].includes(status);
  const isDone = status === "done";
  const isError = status === "error";
  const isReviewing = status === "reviewing";

  return (
    <div style={{ padding: "18px 16px", minWidth: 240 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {/* Docker-inspired whale icon */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#2496ED" />
          {/* Whale body */}
          <ellipse cx="16" cy="18" rx="9" ry="6" fill="white" />
          {/* Whale tail */}
          <path d="M7 18 Q4 15 5 12 Q6 15 7 14" fill="white" />
          {/* Whale spout */}
          <path d="M18 12 Q19 9 20 10 Q19 11 20 12" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Container slots on whale */}
          <rect x="11" y="14" width="4" height="3" rx="0.5" fill="#2496ED" />
          <rect x="16" y="14" width="4" height="3" rx="0.5" fill="#2496ED" />
        </svg>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#2496ED", letterSpacing: "-0.5px" }}>
          Decker
        </span>
      </div>

      {/* Status */}
      <div style={{
        fontSize: 12,
        color: isRecording ? "#ef4444" : isBusy ? "#f59e0b" : isDone ? "#10b981" : isError ? "#ef4444" : "#9ca3af",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 6,
        lineHeight: 1.4,
      }}>
        {isRecording && (
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#ef4444", flexShrink: 0,
            animation: "pulse 1.2s ease-in-out infinite",
          }} />
        )}
        {statusText(status, statusMsg)}
      </div>

      {/* Error from invocation */}
      {error && (
        <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 10, lineHeight: 1.4 }}>
          {error}
        </div>
      )}

      {/* Start button — only when idle */}
      {isIdle && (
        <button
          onClick={handleStart}
          disabled={starting}
          style={{
            width: "100%",
            padding: "10px 0",
            background: starting ? "#1d63ed88" : "#2496ED",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: starting ? "not-allowed" : "pointer",
            letterSpacing: "0.2px",
          }}
        >
          {starting ? "Starting…" : "▶  Start Recording"}
        </button>
      )}

      {/* Reviewing hint */}
      {isReviewing && (
        <div style={{ fontSize: 11, color: "#7c3aed", lineHeight: 1.4 }}>
          Check the Decker panel in your Meet tab to review and generate.
        </div>
      )}

      {/* Footer hint */}
      <div style={{ marginTop: 12, fontSize: 10, color: "#374151", lineHeight: 1.5 }}>
        {isIdle ? "Navigate to meet.google.com first" : "Use the panel in Meet to control recording."}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
