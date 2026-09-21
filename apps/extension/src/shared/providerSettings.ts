import type { ProviderId, ProviderSelection } from "../providers/types";

export const PROVIDER_SETTINGS_STORAGE_KEY = "providerSettings";

export interface StoredProviderSettings extends ProviderSelection {
  version: 1;
}

export interface ProviderSettingsStorage {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
}

function isProvider(value: unknown): value is ProviderId {
  return value === "openai" || value === "gemini";
}

function parseStored(value: unknown): StoredProviderSettings | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StoredProviderSettings>;
  if (candidate.version !== 1 || !isProvider(candidate.provider) || typeof candidate.apiKey !== "string") return null;
  return { version: 1, provider: candidate.provider, apiKey: candidate.apiKey.trim() };
}

export async function loadProviderSettings(
  storage: ProviderSettingsStorage = chrome.storage.local
): Promise<StoredProviderSettings> {
  const values = await storage.get([PROVIDER_SETTINGS_STORAGE_KEY, "openaiKey"]);
  const stored = parseStored(values[PROVIDER_SETTINGS_STORAGE_KEY]);
  if (stored) return stored;

  const legacyKey = typeof values.openaiKey === "string" ? values.openaiKey.trim() : "";
  const migrated: StoredProviderSettings = { version: 1, provider: "openai", apiKey: legacyKey };
  if (legacyKey) await storage.set({ [PROVIDER_SETTINGS_STORAGE_KEY]: migrated });
  return migrated;
}

export async function saveProviderSettings(
  storage: ProviderSettingsStorage = chrome.storage.local,
  selection: ProviderSelection
): Promise<StoredProviderSettings> {
  const apiKey = selection.apiKey.trim();
  if (!apiKey) throw new Error("API key is required.");
  const settings: StoredProviderSettings = {
    version: 1,
    provider: selection.provider,
    apiKey,
  };
  const values: Record<string, unknown> = { [PROVIDER_SETTINGS_STORAGE_KEY]: settings };
  if (settings.provider === "openai") values.openaiKey = settings.apiKey;
  await storage.set(values);
  return settings;
}
