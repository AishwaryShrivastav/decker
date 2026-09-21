import { readSseText, responseError } from "./http";
import type { FetchLike, ProviderAdapter, ProviderModel, TextGenerationRequest } from "./types";
import { createSilentValidationAudio } from "./validationAudio";

const API_BASE = "https://api.openai.com/v1";
const MODELS: Record<ProviderModel, string> = {
  mini: "gpt-4o-mini",
  full: "gpt-4o",
};
const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/flac": "flac",
};

function completionText(data: unknown): string {
  const response = data as { choices?: { message?: { content?: string | null } }[] };
  return response.choices?.[0]?.message?.content ?? "{}";
}

function streamText(data: unknown): string {
  const event = data as { choices?: { delta?: { content?: string | null } }[] };
  return event.choices?.[0]?.delta?.content ?? "";
}

export function createOpenAIProvider(apiKey: string, fetchImpl: FetchLike = fetch): ProviderAdapter {
  const headers = { Authorization: `Bearer ${apiKey}` };

  const transcribeAudio = async (audio: Blob, filename?: string, operation = "transcription"): Promise<string> => {
    const mimeType = audio.type.split(";")[0]?.trim() || "audio/webm";
    const file = new File([audio], filename ?? `audio.${MIME_TO_EXT[mimeType] ?? "webm"}`, { type: mimeType });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-1");
    formData.append("language", "en");
    const response = await fetchImpl(`${API_BASE}/audio/transcriptions`, {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers,
      body: formData,
    });
    if (!response.ok) throw await responseError("OpenAI", operation, response);
    const data = await response.json() as { text?: string };
    return data.text?.trim() ?? "";
  };

  const probeGeneration = async (model: string): Promise<void> => {
    const response = await fetchImpl(`${API_BASE}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "." }],
      }),
    });
    if (!response.ok) throw await responseError("OpenAI", `${model} generation capability check`, response);
  };

  const textRequest = (request: TextGenerationRequest, stream: boolean): RequestInit => ({
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELS[request.model ?? (stream ? "full" : "mini")],
      max_tokens: stream ? 16384 : 2048,
      stream,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userMessage },
      ],
    }),
  });

  return {
    id: "openai",
    label: "OpenAI",
    async validateKey(): Promise<void> {
      await probeGeneration(MODELS.mini);
      await probeGeneration(MODELS.full);
      await transcribeAudio(createSilentValidationAudio(), "validation.wav", "transcription capability check");
    },
    async transcribe(audio: Blob): Promise<string> {
      return transcribeAudio(audio);
    },
    async complete(request: TextGenerationRequest): Promise<string> {
      const response = await fetchImpl(`${API_BASE}/chat/completions`, textRequest(request, false));
      if (!response.ok) throw await responseError("OpenAI", "text generation", response);
      return completionText(await response.json());
    },
    async stream(request: TextGenerationRequest): Promise<string> {
      const response = await fetchImpl(`${API_BASE}/chat/completions`, textRequest(request, true));
      if (!response.ok) throw await responseError("OpenAI", "streamed text generation", response);
      return readSseText(response, streamText, request.onProgress);
    },
  };
}
