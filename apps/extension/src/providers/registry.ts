import { createGeminiProvider } from "./gemini";
import { createOpenAIProvider } from "./openai";
import type { FetchLike, ProviderAdapter, ProviderSelection } from "./types";

export function createProviderAdapter(
  selection: ProviderSelection,
  fetchImpl: FetchLike = fetch
): ProviderAdapter {
  if (selection.provider === "openai") return createOpenAIProvider(selection.apiKey.trim(), fetchImpl);
  if (selection.provider === "gemini") return createGeminiProvider(selection.apiKey.trim(), fetchImpl);
  throw new Error(`Unsupported provider: ${String(selection.provider)}`);
}

export type { ProviderAdapter, ProviderId, ProviderSelection, TextGenerationRequest } from "./types";
