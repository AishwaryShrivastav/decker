export type ProviderId = "openai" | "gemini";
export type ProviderModel = "mini" | "full";

export interface ProviderSelection {
  provider: ProviderId;
  apiKey: string;
}

export interface TextGenerationRequest {
  systemPrompt: string;
  userMessage: string;
  model?: ProviderModel;
  onProgress?: (tokenCount: number) => void;
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly label: string;
  validateKey(): Promise<void>;
  transcribe(audio: Blob): Promise<string>;
  complete(request: TextGenerationRequest): Promise<string>;
  stream(request: TextGenerationRequest): Promise<string>;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
