import type { TextGenerationRequest } from "./types";

export async function responseError(
  provider: string,
  operation: string,
  response: Response
): Promise<Error> {
  const raw = await response.text();
  let detail = raw;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } | string; message?: string };
    detail = typeof parsed.error === "string"
      ? parsed.error
      : parsed.error?.message ?? parsed.message ?? raw;
  } catch {
    // Keep the provider's plain-text response.
  }
  const suffix = detail.trim() ? `: ${detail.trim()}` : "";
  return new Error(`${provider} ${operation} failed (${response.status})${suffix}`);
}

export async function readSseText(
  response: Response,
  textFromEvent: (event: unknown) => string,
  onProgress?: TextGenerationRequest["onProgress"]
): Promise<string> {
  if (!response.body) throw new Error("Provider stream returned no response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let tokenCount = 0;

  const consume = (line: string): void => {
    if (!line.startsWith("data: ")) return;
    const raw = line.slice(6).trim();
    if (!raw || raw === "[DONE]") return;
    try {
      const text = textFromEvent(JSON.parse(raw) as unknown);
      if (!text) return;
      fullText += text;
      tokenCount++;
      if (tokenCount % 100 === 0) onProgress?.(tokenCount);
    } catch {
      // A malformed event should not discard valid text from the rest of the stream.
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(consume);
    }
    buffer += decoder.decode();
    buffer.split("\n").forEach(consume);
  } finally {
    reader.releaseLock();
  }

  return fullText;
}
