export const ACTIVATION_STORAGE_KEY = "deckerActivationV1";

export const ACTIVATION_MILESTONES = [
  "key_saved",
  "recording_started",
  "transcript_ready",
  "output_generated",
] as const;

export type ActivationMilestone = (typeof ACTIVATION_MILESTONES)[number];

export interface ActivationState {
  version: 1;
  firstSeenAt: string;
  milestones: Partial<Record<ActivationMilestone, string>>;
}

interface ActivationStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

function freshState(at: string): ActivationState {
  return { version: 1, firstSeenAt: at, milestones: {} };
}

export async function getActivationState(
  storage: ActivationStorage = chrome.storage.local
): Promise<ActivationState | null> {
  const result = await storage.get(ACTIVATION_STORAGE_KEY);
  const value = result[ACTIVATION_STORAGE_KEY];
  if (!value || typeof value !== "object") return null;

  const state = value as ActivationState;
  if (state.version !== 1 || !state.milestones || typeof state.milestones !== "object") return null;
  return state;
}

export async function recordActivation(
  milestone: ActivationMilestone,
  storage: ActivationStorage = chrome.storage.local,
  now: () => Date = () => new Date()
): Promise<ActivationState> {
  const timestamp = now().toISOString();
  const existing = await getActivationState(storage);
  const state = existing ?? freshState(timestamp);

  if (!state.milestones[milestone]) {
    state.milestones[milestone] = timestamp;
    await storage.set({ [ACTIVATION_STORAGE_KEY]: state });
  }

  return state;
}

export function completedMilestones(state: ActivationState | null): ActivationMilestone[] {
  if (!state) return [];
  return ACTIVATION_MILESTONES.filter((milestone) => Boolean(state.milestones[milestone]));
}
