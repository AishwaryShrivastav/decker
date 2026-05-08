export enum MessageType {
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
  status: RecordingStatus;
  message?: string;
  transcript?: string;
  points?: string[];
  /** Live meeting notes during recording (same as transcript when status is recording) */
  liveNotes?: string;
  /** Per-topic research state, updated incrementally */
  topicResearch?: TopicResearch[];
  /** Live streaming preview text during generation */
  streamText?: string;
}

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface OffscreenStartPayload {
  streamId: string;
}

export interface AudioChunkPayload {
  base64: string;
  mimeType: string;
}

export interface RecordingStoppedPayload {
  base64: string;
  mimeType: string;
}

export interface ApiSettings {
  claudeKey: string;
  openaiKey: string;
}

export interface StartRecordingStreamPayload {
  tabId: number;
  streamId: string;
}

export interface FullStateResponse {
  status: RecordingStatus;
  message?: string;
  transcript?: string;
  points?: string[];
  topicResearch?: TopicResearch[];
  hasHtml: boolean;
  claudeKey: string;
  openaiKey: string;
}

export interface TopicSelectedPayload {
  topic: string;
}

export type OutputFormat = "doc" | "prototype" | "presentation" | "notes";

export interface GenerateDeckPayload {
  selectedPoints: string[];
  customPrompt: string;
  transcript?: string;
  outputFormat?: OutputFormat;
  backgroundColor?: string;
}
