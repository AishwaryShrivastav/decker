import { useState, useEffect } from "react";
import { Message, MessageType, RecordingStatus, StatusPayload } from "../shared/types";

function statusColor(status: RecordingStatus): string {
  switch (status) {
    case "recording":
      return "#ef4444";
    case "processing":
    case "transcribing":
    case "generating":
      return "#f59e0b";
    case "done":
      return "#10b981";
    case "error":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function statusText(status: RecordingStatus, msg?: string): string {
  switch (status) {
    case "idle":
      return "Ready — open a Google Meet to start";
    case "recording":
      return "Recording in progress…";
    case "processing":
      return "Processing audio…";
    case "transcribing":
      return msg ?? "Transcribing audio…";
    case "generating":
      return msg ?? "Generating deck…";
    case "done":
      return msg ?? "Deck ready! Check your Downloads.";
    case "error":
      return `Error: ${msg ?? "Unknown error"}`;
  }
}

export function Popup() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [statusMsg, setStatusMsg] = useState<string | undefined>();

  useEffect(() => {
    // Fetch current status on mount
    chrome.runtime
      .sendMessage<Message>({ type: MessageType.GET_STATUS })
      .then((res) => {
        const r = res as { status: RecordingStatus };
        if (r?.status) setStatus(r.status);
      })
      .catch(() => {});

    // Listen for updates while popup is open
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

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#7c3aed",
            letterSpacing: "-0.5px",
          }}
        >
          Decker
        </span>
      </div>

      <div
        style={{
          fontSize: 13,
          color: statusColor(status),
          lineHeight: 1.5,
        }}
      >
        {status === "recording" && (
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: "#ef4444",
              borderRadius: "50%",
              marginRight: 6,
            }}
          />
        )}
        {statusText(status, statusMsg)}
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: "#4b5563" }}>
        Use the Decker panel inside Google Meet to control recording.
      </div>
    </div>
  );
}
