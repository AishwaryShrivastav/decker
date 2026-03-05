export enum MessageType {
  // Content → Background
  GET_TAB_ID = "GET_TAB_ID",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  GET_STATUS = "GET_STATUS",
  GET_API_SETTINGS = "GET_API_SETTINGS",
  SET_API_SETTINGS = "SET_API_SETTINGS",
  GENERATE_DECK = "GENERATE_DECK",
  START_RECORDING_WITH_STREAM = "START_RECORDING_WITH_STREAM",

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
  | "transcribing"
  | "extracting"
  | "reviewing"
  | "generating"
  | "done"
  | "error";

export interface StatusPayload {
  status: RecordingStatus;
  message?: string;
  transcript?: string;
  points?: string[];
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
  apiKey: string;
}

export interface StartRecordingStreamPayload {
  tabId: number;
  streamId: string;
}

export interface GenerateDeckPayload {
  selectedPoints: string[];
  customPrompt: string;
}
