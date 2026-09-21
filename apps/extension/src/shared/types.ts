export enum MessageType {
  SAVE_REVIEW = "SAVE_REVIEW",
  PREFLIGHT = "PREFLIGHT",
  OFFSCREEN_STATUS = "OFFSCREEN_STATUS",
  CAPTURE_WARNING = "CAPTURE_WARNING",
  GET_LAST_HTML = "GET_LAST_HTML",
  // Content → Background
  GET_TAB_ID = "GET_TAB_ID",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  GET_STATUS = "GET_STATUS",
  GET_API_SETTINGS = "GET_API_SETTINGS",
  SET_API_SETTINGS = "SET_API_SETTINGS",
  GET_DEBUG_LOG = "GET_DEBUG_LOG",
  GENERATE_DECK = "GENERATE_DECK",
  START_RECORDING_WITH_STREAM = "START_RECORDING_WITH_STREAM",
  TOPIC_SELECTED = "TOPIC_SELECTED",
  TOPIC_DESELECTED = "TOPIC_DESELECTED",
  GET_FULL_STATE = "GET_FULL_STATE",
  RESET_STATE = "RESET_STATE",

  // Background → Offscreen
  OFFSCREEN_START = "OFFSCREEN_START",
  OFFSCREEN_STOP = "OFFSCREEN_STOP",

  // Offscreen → Background
  AUDIO_CHUNK = "AUDIO_CHUNK",
  RECORDING_STOPPED = "RECORDING_STOPPED",

  // Background → Content (broadcast)
  STATUS_UPDATE = "STATUS_UPDATE",
}

export type RecordingStatus =
  | "idle"
  | "recording"
  | "processing"
  | "finalizing"
  | "transcribing"
  | "extracting"
  | "researching"
  | "reviewing"
  | "generating"
  | "done"
  | "error";

export interface TopicResearch {
  topic: string;
  status: "pending" | "researching" | "done" | "error";
  summary?: string;
  keyInsight?: string;
  subtopics?: string[];
}

export interface StatusPayload {
  sessionId?: string;
  transcriptRevision?: number;
  warnings?: string[];
  selectedPoints?: string[];
  status: RecordingStatus;
  message?: string;
  transcript?: string;
  points?: string[];
  topicResearch?: TopicResearch[];
}

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface OffscreenStartPayload {
  sessionId: string;
  streamId: string;
}

export interface AudioChunkPayload {
  sessionId: string;
  sequence: number;
  base64: string;
  mimeType: string;
}

export interface RecordingStoppedPayload extends AudioChunkPayload {
  missingSequences?: number[];
}

export interface ApiSettings {
  provider?: "openai" | "gemini";
  apiKey?: string;
  openaiKey?: string;
}

export interface StartRecordingStreamPayload {
  tabId: number;
  streamId: string;
}

export interface FullStateResponse {
  sessionId: string;
  transcriptRevision: number;
  warnings: string[];
  selectedPoints: string[];
  customPrompt: string;
  outputFormat: OutputFormat;
  edit?: { text: string; baseRevision: number };
  status: RecordingStatus;
  message?: string;
  transcript?: string;
  points?: string[];
  topicResearch?: TopicResearch[];
  hasHtml: boolean;
  provider: "openai" | "gemini";
  apiKey: string;
  openaiKey: string;
}

export interface TopicSelectedPayload {
  topic: string;
}

export type OutputFormat = "doc" | "prototype" | "presentation" | "notes";

export interface GenerateDeckPayload {
  sessionId?: string;
  transcriptRevision?: number;
  transcriptEdited?: boolean;
  selectedPoints: string[];
  customPrompt: string;
  transcript?: string;
  outputFormat?: OutputFormat;
}
