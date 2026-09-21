import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProviderId } from "../providers/types";
import { assessCaptureTab, captureErrorMessage, type CaptureReadiness, type CaptureTab } from "../shared/tabReadiness";
import {
  MessageType,
  type ApiSettings,
  type FullStateResponse,
  type Message,
  type RecordingStatus,
  type StartRecordingStreamPayload,
  type StatusPayload,
  type CaptureSource,
} from "../shared/types";
import { popupStage, providerSetup, savedStateNotice, settingsControlsDisabled, statusUpdateIsCurrent, type SettingsSaveState } from "./model";

const C = {
  blue: "#818cf8",
  red: "#ef4444",
  green: "#34d399",
  amber: "#f59e0b",
  dimText: "#94a3b8",
  text: "#e2e8f0",
  bg: "#080c18",
  surface: "#0d1224",
  border: "rgba(255,255,255,0.08)",
};

type MicState = "checking" | "granted" | "prompt" | "denied" | "unavailable";
function statusText(status: RecordingStatus, message?: string): string {
  if (message && ["processing", "finalizing", "transcribing", "extracting"].includes(status)) return message;
  switch (status) {
    case "recording": return "Recording meeting audio";
    case "processing": return "Finishing audio capture...";
    case "finalizing": return "Preparing saved audio...";
    case "transcribing": return "Finishing transcription...";
    case "extracting": return "Saving the transcript...";
    case "error": return message ?? "Recording could not start";
    default: return "Ready to record";
  }
}

const emptyReadiness: CaptureReadiness = {
  eligible: false,
  meetingName: "Browser meeting",
  message: "Checking the active tab...",
};

export function Popup() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saveState, setSaveState] = useState<SettingsSaveState>("idle");
  const [credentialSaved, setCredentialSaved] = useState(false);

  const [readiness, setReadiness] = useState<CaptureReadiness>(emptyReadiness);
  const [includeMicrophone, setIncludeMicrophone] = useState(true);
  const [captureSource, setCaptureSource] = useState<CaptureSource | null>(null);
  const [micState, setMicState] = useState<MicState>("checking");
  const sessionIdRef = useRef("");
  const sessionGenerationRef = useRef(-1);
  const transcriptRevisionRef = useRef(0);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const setup = providerSetup(provider);
  const stage = popupStage(status, showSettings);
  const savedNotice = savedStateNotice(status);
  const displayedError = error ?? (status === "error" ? statusMessage ?? "Recording could not start." : null);
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const settingsPending = settingsControlsDisabled(saveState);

  const refreshActiveTab = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const captureTab: CaptureTab | undefined = tab
        ? { id: tab.id, active: tab.active, url: tab.url, audible: tab.audible, mutedInfo: tab.mutedInfo }
        : undefined;
      setReadiness(assessCaptureTab(captureTab));
      return captureTab;
    } catch {
      setReadiness({
        eligible: false,
        meetingName: "Browser meeting",
        message: "Decker could not inspect the active tab. Reopen the popup and try again.",
      });
      return undefined;
    }
  }, []);

  useEffect(() => {
    const applyStatus = (payload: StatusPayload) => {
      if (!statusUpdateIsCurrent(sessionIdRef.current, sessionGenerationRef.current, transcriptRevisionRef.current, payload)) return;
      const nextGeneration = payload.sessionGeneration ?? sessionGenerationRef.current;
      if (nextGeneration > sessionGenerationRef.current || (!sessionIdRef.current && payload.sessionId)) {
        if (payload.sessionId) sessionIdRef.current = payload.sessionId;
        sessionGenerationRef.current = nextGeneration;
        transcriptRevisionRef.current = 0;
        setTranscript("");
        setWarnings([]);
      }
      if (payload.transcriptRevision !== undefined) transcriptRevisionRef.current = payload.transcriptRevision;
      if (payload.captureSource !== undefined) setCaptureSource(payload.captureSource);
      if (payload.includeMicrophone !== undefined) setIncludeMicrophone(payload.includeMicrophone);
      setStatus(payload.status);
      setStatusMessage(payload.message);
      if (payload.warnings) setWarnings(payload.warnings);
      if (payload.transcript !== undefined) setTranscript(payload.transcript);
    };
    const onMessage = (message: Message) => {
      if (message.type === MessageType.STATUS_UPDATE) applyStatus(message.payload as StatusPayload);
    };
    chrome.runtime.onMessage.addListener(onMessage);
    chrome.runtime.sendMessage<Message>({ type: MessageType.GET_FULL_STATE })
      .then((response: FullStateResponse & { error?: string }) => {
        if (!response || response.error) throw new Error(response?.error ?? "Decker could not restore the saved recording.");
        applyStatus(response);
        setProvider(response.provider);
        setApiKey(response.apiKey);
        setCredentialSaved(Boolean(response.apiKey.trim()));
        setShowSettings(!response.apiKey.trim());
        setHydrated(true);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : String(reason)));
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  useEffect(() => {
    if (stage === "setup") keyInputRef.current?.focus();
  }, [stage, provider]);

  useEffect(() => {
    void refreshActiveTab();
    const refresh = () => { void refreshActiveTab(); };
    chrome.tabs.onActivated?.addListener(refresh);
    chrome.tabs.onUpdated?.addListener(refresh);
    return () => {
      chrome.tabs.onActivated?.removeListener(refresh);
      chrome.tabs.onUpdated?.removeListener(refresh);
    };
  }, [refreshActiveTab]);

  useEffect(() => {
    let permission: PermissionStatus | undefined;
    let mounted = true;
    navigator.permissions.query({ name: "microphone" as PermissionName })
      .then(result => {
        if (!mounted) return;
        permission = result;
        const update = () => setMicState(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "prompt");
        update();
        result.onchange = update;
      })
      .catch(() => { if (mounted) setMicState("unavailable"); });
    return () => {
      mounted = false;
      if (permission) permission.onchange = null;
    };
  }, []);

  const buttonStyle = useMemo(() => ({
    width: "100%",
    padding: "10px 14px",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } as const), []);

  const openMicPermission = () => chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });

  const handleProviderChange = (next: ProviderId) => {
    if (settingsPending || next === provider) return;
    setProvider(next);
    setApiKey("");
    setCredentialSaved(false);
    setSaveState("idle");
    setError(null);
  };

  const handleSaveKey = async () => {
    if (settingsPending) return;
    setError(null);
    setSaveState("validating");
    try {
      const response = await chrome.runtime.sendMessage<Message<ApiSettings>>({
        type: MessageType.SET_API_SETTINGS,
        payload: { provider, apiKey: apiKey.trim() },
      });
      if (!response?.ok) throw new Error(response?.error ?? `${setup.label} could not validate this key.`);
      setCredentialSaved(true);
      setSaveState("saved");
    } catch (reason) {
      setCredentialSaved(false);
      setSaveState("idle");
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const handleClearKey = async () => {
    if (settingsPending) return;
    setError(null);
    setSaveState("clearing");
    try {
      const response = await chrome.runtime.sendMessage<Message>({ type: MessageType.CLEAR_PROVIDER_SETTINGS });
      if (!response?.ok) throw new Error(response?.error ?? "Decker could not clear the saved key.");
      setApiKey("");
      setCredentialSaved(false);
      setSaveState("idle");
    } catch (reason) {
      setSaveState("idle");
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const handleStart = async () => {
    setError(null);
    setStarting(true);
    try {
      const preflight = await chrome.runtime.sendMessage({ type: MessageType.PREFLIGHT });
      if (!preflight?.ok) throw new Error(preflight?.error ?? `Save a ${setup.label} API key before recording.`);

      const tab = await refreshActiveTab();
      const currentReadiness = assessCaptureTab(tab);
      if (!currentReadiness.eligible || !tab?.id) throw new Error(currentReadiness.message);

      if (includeMicrophone) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setMicState("granted");
        } catch {
          setMicState("denied");
          throw new Error("Microphone access was denied. Turn off Include microphone to record tab audio only, or allow microphone access first.");
        }
      }

      const streamId = await new Promise<string>((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, id => {
          if (chrome.runtime.lastError) reject(new Error(captureErrorMessage(chrome.runtime.lastError.message ?? "Capture permission was denied.")));
          else if (!id) reject(new Error("Decker could not start tab audio capture. Reopen the meeting tab and try again."));
          else resolve(id);
        });
      });

      const started = await chrome.runtime.sendMessage<Message<StartRecordingStreamPayload>>({
        type: MessageType.START_RECORDING_WITH_STREAM,
        payload: { tabId: tab.id, streamId, includeMicrophone },
      });
      if (!started?.ok) throw new Error(captureErrorMessage(started?.error ?? "Audio capture did not start."));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setError(null);
    const response = await chrome.runtime.sendMessage<Message>({ type: MessageType.STOP_RECORDING }).catch(() => null);
    if (!response?.ok) setError(response?.error ?? "Decker could not stop the recorder. Reopen the popup to recover the session.");
  };

  const micLabel = !includeMicrophone ? "Microphone excluded"
    : micState === "granted" ? "Microphone ready"
    : micState === "denied" ? "Microphone blocked"
    : micState === "checking" ? "Checking microphone"
    : "Microphone permission needed";

  return (
    <main style={{ padding: "14px 16px", minWidth: 340, maxWidth: 420, background: C.bg, color: C.text, minHeight: "100%" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={chrome.runtime.getURL("icons/icon48.png")} width={28} height={28} style={{ borderRadius: 6 }} alt="" />
          <span style={{ fontSize: 17, fontWeight: 800, color: C.blue }}>Decker</span>
        </div>
        <button type="button" onClick={() => setShowSettings(value => !value)} aria-label="Settings" style={{ background: "none", border: "none", color: C.dimText, cursor: "pointer", fontSize: 14 }}>
          Settings
        </button>
      </header>

      {stage === "setup" && (
        <section style={{ marginBottom: 12, padding: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <div role="group" aria-label="AI provider" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
            {(["openai", "gemini"] as ProviderId[]).map(option => (
              <button key={option} type="button" aria-pressed={provider === option} disabled={settingsPending} onClick={() => handleProviderChange(option)} style={{ ...buttonStyle, padding: "8px", color: provider === option ? C.bg : C.text, background: provider === option ? C.blue : C.bg, border: `1px solid ${provider === option ? C.blue : C.border}` }}>
                {providerSetup(option).label}
              </button>
            ))}
          </div>

          <label htmlFor="provider-key" style={{ display: "block", fontSize: 12, marginBottom: 5 }}>{setup.keyLabel}</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input ref={keyInputRef} id="provider-key" type={showKey ? "text" : "password"} value={apiKey} placeholder={setup.placeholder} disabled={settingsPending}
              onChange={event => { setApiKey(event.target.value); setCredentialSaved(false); setSaveState("idle"); }}
              style={{ flex: 1, minWidth: 0, padding: 8, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text }} />
            <button type="button" disabled={settingsPending} onClick={() => setShowKey(value => !value)} style={{ padding: "0 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.dimText, cursor: "pointer" }}>
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <a href={setup.helpUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 7, color: C.blue, fontSize: 11 }}>{setup.helpText}</a>
          <p style={{ color: C.dimText, fontSize: 11, lineHeight: 1.5, margin: "9px 0" }}>
            Decker saves this key in extension storage. Requests go directly to {setup.label}; the developer does not receive your key or meeting content.
          </p>
          <div style={{ display: "flex", gap: 7 }}>
            <button type="button" disabled={!apiKey.trim() || settingsPending} onClick={handleSaveKey}
              style={{ ...buttonStyle, flex: 1, padding: "8px", color: C.bg, background: C.blue, opacity: apiKey.trim() ? 1 : 0.5 }}>
              {saveState === "validating" ? "Checking key..." : saveState === "saved" ? "Key saved" : "Save key"}
            </button>
            <button type="button" disabled={settingsPending} onClick={handleClearKey} style={{ ...buttonStyle, width: "auto", padding: "8px 12px", color: C.text, background: "transparent", border: `1px solid ${C.border}` }}>
              {saveState === "clearing" ? "Clearing..." : "Clear key"}
            </button>
          </div>
        </section>
      )}

      {displayedError && <div role="alert" style={{ marginBottom: 10, padding: 9, borderRadius: 6, color: C.red, background: "rgba(239,68,68,0.1)", fontSize: 11, lineHeight: 1.45 }}>{displayedError}</div>}
      {warnings.length > 0 && (
        <div role="alert" style={{ marginBottom: 10, padding: 9, borderRadius: 6, color: C.amber, background: C.surface, fontSize: 11 }}>
          {warnings.map(warning => <div key={warning}>{warning}</div>)}
        </div>
      )}

      {stage === "readiness" && (
        <section>
          <h1 style={{ fontSize: 15, margin: "0 0 10px" }}>Ready to record</h1>
          {savedNotice && <div role="status" style={{ marginBottom: 9, padding: 9, borderRadius: 6, color: C.green, background: C.surface, fontSize: 11 }}>{savedNotice}</div>}
          <div style={{ padding: 11, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, display: "grid", gap: 8, fontSize: 12 }}>
            <div style={{ color: credentialSaved ? C.green : C.amber }}>{credentialSaved ? `${setup.label} key saved` : `Save a ${setup.label} API key`}</div>
            <div style={{ color: readiness.eligible ? C.green : C.amber }}>{readiness.message}</div>
            {readiness.warning && <div style={{ color: C.amber }}>{readiness.warning}</div>}
            <div style={{ color: includeMicrophone && micState !== "granted" ? C.amber : C.green }}>{micLabel}</div>
          </div>

          {!credentialSaved && <button type="button" onClick={() => setShowSettings(true)} style={{ ...buttonStyle, marginTop: 9, color: C.text, background: "transparent", border: `1px solid ${C.border}` }}>Set up provider</button>}

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11, fontSize: 12, color: C.text }}>
            <input type="checkbox" checked={includeMicrophone} onChange={event => setIncludeMicrophone(event.target.checked)} />
            Include my microphone
          </label>
          {includeMicrophone && micState !== "granted" && (
            <button type="button" onClick={openMicPermission} style={{ ...buttonStyle, marginTop: 8, color: C.text, background: "transparent", border: `1px solid ${C.border}` }}>Allow microphone access</button>
          )}

          <p style={{ margin: "11px 0", color: C.dimText, fontSize: 11, lineHeight: 1.55 }}>
            Decker records eligible browser tabs and checks the captured audio signal after starting. Native Zoom, Teams, and Webex apps are not supported.
          </p>
          <p style={{ margin: "0 0 11px", color: C.dimText, fontSize: 11, lineHeight: 1.55 }}>
            By starting, you confirm that you have permission to record. Audio and transcript content go directly to {setup.label} using your key. Provider API charges may apply. One recovery session is stored on this device. <a href="https://decker.techforgood.studio/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>Privacy policy</a>
          </p>
          <button type="button" onClick={handleStart} disabled={starting || !hydrated || !credentialSaved || !readiness.eligible}
            style={{ ...buttonStyle, color: C.bg, background: C.blue, opacity: hydrated && credentialSaved && readiness.eligible ? 1 : 0.5 }}>
            {starting ? "Starting recording..." : "Start recording"}
          </button>
        </section>
      )}

      {stage === "recording" && (
        <section style={{ padding: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: status === "recording" ? C.red : C.amber, fontSize: 13, fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: status === "recording" ? C.red : C.amber }} />
            {statusText(status, statusMessage)}
          </div>
          {status === "recording" && (
            <>
              <div style={{ marginTop: 9, color: C.dimText, fontSize: 11 }}>{captureSource?.name ?? readiness.meetingName}, {includeMicrophone ? "tab audio and microphone" : "tab audio only"}</div>
              <div style={{ marginTop: 5, color: C.dimText, fontSize: 11 }}>{wordCount ? `${wordCount} words transcribed so far` : "Listening for speech..."}</div>
              <button type="button" onClick={handleStop} style={{ ...buttonStyle, marginTop: 12, color: "#fff", background: C.red }}>Stop recording</button>
            </>
          )}
          {status !== "recording" && <p style={{ margin: "9px 0 0", color: C.dimText, fontSize: 11 }}>Keep Decker open while the last audio segments are saved.</p>}
        </section>
      )}

      <style>{`* { box-sizing: border-box; } body { margin: 0; background: ${C.bg}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; } button:disabled { cursor: not-allowed; }`}</style>
    </main>
  );
}
