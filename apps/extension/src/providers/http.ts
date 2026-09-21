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
  let eventData: string[] = [];
  let fullText = "";
  let tokenCount = 0;

  const dispatchEvent = (): void => {
    const raw = eventData.join("\n");
    eventData = [];
    if (!raw || raw.trim() === "[DONE]") return;
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

  const consumeLine = (line: string): void => {
    if (!line) {
      dispatchEvent();
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    if (field !== "data") return;
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    eventData.push(value);
  };

  const consumeBufferedLines = (atEnd = false): void => {
    while (buffer) {
      const lf = buffer.indexOf("\n");
      const cr = buffer.indexOf("\r");
      const candidates = [lf, cr].filter(index => index >= 0);
      if (candidates.length === 0) break;
      const lineEnd = Math.min(...candidates);
      if (!atEnd && buffer[lineEnd] === "\r" && lineEnd === buffer.length - 1) break;
      const line = buffer.slice(0, lineEnd);
      const newlineLength = buffer[lineEnd] === "\r" && buffer[lineEnd + 1] === "\n" ? 2 : 1;
      buffer = buffer.slice(lineEnd + newlineLength);
      consumeLine(line);
    }
    if (atEnd && buffer) {
      consumeLine(buffer);
      buffer = "";
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      consumeBufferedLines();
    }
    buffer += decoder.decode();
    consumeBufferedLines(true);
    dispatchEvent();
  } finally {
    reader.releaseLock();
  }

  return fullText;
}
