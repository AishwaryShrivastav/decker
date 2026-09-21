import { readSseText, responseError } from "./http";
import type { FetchLike, ProviderAdapter, ProviderModel, TextGenerationRequest } from "./types";
import { createSilentValidationAudio } from "./validationAudio";

const API_BASE = "https://generativelanguage.googleapis.com";
const TEXT_MODELS: Record<ProviderModel, string> = {
  mini: "gemini-3.5-flash",
  full: "gemini-3.8-flash",
};
const FILE_DELETE_ATTEMPTS = 3;

function generatedText(data: unknown): string {
  const response = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return response.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("") ?? "";
}

function interactionText(data: unknown): string {
  const response = data as {
    output_text?: string;
    outputs?: { text?: string }[];
    steps?: { content?: { text?: string }[] }[];
  };
  if (typeof response.output_text === "string") return response.output_text;
  const outputs = response.outputs?.map(output => output.text ?? "").join("") ?? "";
  if (outputs) return outputs;
  return response.steps?.flatMap(step => step.content ?? []).map(part => part.text ?? "").join("") ?? "";
}

export function createGeminiProvider(apiKey: string, fetchImpl: FetchLike = fetch): ProviderAdapter {
  const authHeaders = { "x-goog-api-key": apiKey };

  const deleteUploadedFile = async (name: string): Promise<string | null> => {
    let lastError = "unknown error";
    for (let attempt = 1; attempt <= FILE_DELETE_ATTEMPTS; attempt++) {
      try {
        const response = await fetchImpl(`${API_BASE}/v1beta/${name}`, {
          method: "DELETE",
          signal: AbortSignal.timeout(20_000),
          headers: authHeaders,
        });
        if (response.ok) return null;
        lastError = (await responseError("Gemini", "temporary file cleanup", response)).message;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
    return `Gemini could not delete temporary file ${name} after ${FILE_DELETE_ATTEMPTS} attempts: ${lastError}`;
  };

  const generate = async (request: TextGenerationRequest, stream: boolean): Promise<Response> => {
    const model = TEXT_MODELS[request.model ?? (stream ? "full" : "mini")];
    const operation = stream ? "streamGenerateContent?alt=sse" : "generateContent";
    return fetchImpl(`${API_BASE}/v1beta/models/${model}:${operation}`, {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: request.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: request.userMessage }] }],
        generationConfig: { maxOutputTokens: stream ? 16384 : 2048 },
      }),
    });
  };

  const probeGeneration = async (model: string): Promise<void> => {
    const response = await fetchImpl(`${API_BASE}/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "." }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });
    if (!response.ok) throw await responseError("Gemini", `${model} generation capability check`, response);
  };

  const transcribeAudio = async (audio: Blob, onWarning?: (message: string) => void): Promise<string> => {
    const mimeType = audio.type.split(";")[0]?.trim() || "audio/webm";
    const start = await fetchImpl(`${API_BASE}/upload/v1beta/files`, {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(audio.size),
        "X-Goog-Upload-Header-Content-Type": mimeType,
      },
      body: JSON.stringify({ file: { display_name: "Decker audio segment" } }),
    });
    if (!start.ok) throw await responseError("Gemini", "audio upload", start);
    const uploadUrl = start.headers.get("x-goog-upload-url");
    if (!uploadUrl) throw new Error("Gemini audio upload failed: no upload URL returned.");

    const upload = await fetchImpl(uploadUrl, {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        "Content-Length": String(audio.size),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: audio,
    });
    if (!upload.ok) throw await responseError("Gemini", "audio upload", upload);
    const uploaded = await upload.json() as { file?: { name?: string; uri?: string } };
    const name = uploaded.file?.name;
    const uri = uploaded.file?.uri;
    if (!name) throw new Error("Gemini audio upload failed: no file name returned.");

    try {
      if (!uri) throw new Error("Gemini audio upload failed: no file URI returned.");
      const interaction = await fetchImpl(`${API_BASE}/v1beta/interactions`, {
        method: "POST",
        signal: AbortSignal.timeout(60_000),
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify({
          model: "gemini-3.5-transcribe",
          store: false,
          input: [{ type: "audio", uri, mime_type: mimeType }],
          generation_config: { transcription_config: { language_codes: [] } },
        }),
      });
      if (!interaction.ok) throw await responseError("Gemini", "transcription", interaction);
      return interactionText(await interaction.json()).trim();
    } finally {
      const warning = await deleteUploadedFile(name);
      if (warning) onWarning?.(warning);
    }
  };

  return {
    id: "gemini",
    label: "Gemini",
    async validateKey(): Promise<void> {
      await probeGeneration(TEXT_MODELS.mini);
      await probeGeneration(TEXT_MODELS.full);
      try {
        await transcribeAudio(createSilentValidationAudio(), warning => console.warn(`[Decker] ${warning}`));
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Gemini transcription capability check failed: ${detail}`);
      }
    },
    async transcribe(audio: Blob, onWarning?: (message: string) => void): Promise<string> {
      return transcribeAudio(audio, onWarning);
    },
    async complete(request: TextGenerationRequest): Promise<string> {
      const response = await generate(request, false);
      if (!response.ok) throw await responseError("Gemini", "text generation", response);
      return generatedText(await response.json());
    },
    async stream(request: TextGenerationRequest): Promise<string> {
      const response = await generate(request, true);
      if (!response.ok) throw await responseError("Gemini", "streamed text generation", response);
      return readSseText(response, generatedText, request.onProgress);
    },
  };
}
