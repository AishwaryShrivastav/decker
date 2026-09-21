import type { ProviderId } from "../providers/types";
import type { RecordingStatus, StatusPayload } from "../shared/types";

export type SettingsSaveState = "idle" | "validating" | "clearing" | "saved";

export interface ProviderSetup {
  label: string;
  keyLabel: string;
  placeholder: string;
  helpUrl: string;
  helpText: string;
}

export function providerSetup(provider: ProviderId): ProviderSetup {
  if (provider === "gemini") {
    return {
      label: "Gemini",
      keyLabel: "Gemini API key",
      placeholder: "Enter your Gemini API key",
      helpUrl: "https://aistudio.google.com/app/apikey",
      helpText: "Create a Gemini API key",
    };
  }
  return {
    label: "OpenAI",
    keyLabel: "OpenAI API key",
    placeholder: "sk-proj-...",
    helpUrl: "https://platform.openai.com/api-keys",
    helpText: "Create an OpenAI API key",
  };
}

export type PopupStage = "setup" | "readiness" | "recording";

export function popupStage(status: RecordingStatus, showSetup = false): PopupStage {
  if (["recording", "processing", "finalizing", "transcribing", "extracting"].includes(status)) return "recording";
  if (showSetup) return "setup";
  return "readiness";
}

export function savedStateNotice(status: RecordingStatus): string | null {
  return ["reviewing", "researching", "generating", "done"].includes(status)
    ? "Recording saved on this device."
    : null;
}

export function settingsControlsDisabled(saveState: SettingsSaveState): boolean {
  return saveState === "validating" || saveState === "clearing";
}

export function statusUpdateIsCurrent(
  sessionId: string,
  sessionGeneration: number,
  transcriptRevision: number,
  update: Pick<StatusPayload, "sessionId" | "sessionGeneration" | "transcriptRevision">
): boolean {
  const updateGeneration = update.sessionGeneration ?? sessionGeneration;
  if (updateGeneration < sessionGeneration) return false;
  if (updateGeneration > sessionGeneration) return true;
  if (sessionId && update.sessionId && update.sessionId !== sessionId) return false;
  return (update.transcriptRevision ?? transcriptRevision) >= transcriptRevision;
}
