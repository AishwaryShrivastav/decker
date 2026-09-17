const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ACTIVATION_STORAGE_KEY,
  completedMilestones,
  getActivationState,
  recordActivation,
} = require('../src/shared/activation.ts');

function memoryStorage() {
  const values = {};
  return {
    values,
    async get(key) { return { [key]: values[key] }; },
    async set(items) { Object.assign(values, structuredClone(items)); },
  };
}

test('records timestamp-only activation milestones without meeting content', async () => {
  const storage = memoryStorage();
  const first = () => new Date('2026-09-17T10:00:00.000Z');
  const second = () => new Date('2026-09-17T10:05:00.000Z');

  await recordActivation('key_saved', storage, first);
  await recordActivation('recording_started', storage, second);

  assert.deepEqual(storage.values[ACTIVATION_STORAGE_KEY], {
    version: 1,
    firstSeenAt: '2026-09-17T10:00:00.000Z',
    milestones: {
      key_saved: '2026-09-17T10:00:00.000Z',
      recording_started: '2026-09-17T10:05:00.000Z',
    },
  });
  assert.doesNotMatch(JSON.stringify(storage.values), /transcript|meeting|openaiKey|https?:/i);
});

test('keeps the first timestamp and reports milestones in funnel order', async () => {
  const storage = memoryStorage();
  await recordActivation('output_generated', storage, () => new Date('2026-09-17T11:00:00.000Z'));
  await recordActivation('key_saved', storage, () => new Date('2026-09-17T11:01:00.000Z'));
  await recordActivation('output_generated', storage, () => new Date('2026-09-17T12:00:00.000Z'));

  const state = await getActivationState(storage);
  assert.equal(state.milestones.output_generated, '2026-09-17T11:00:00.000Z');
  assert.deepEqual(completedMilestones(state), ['key_saved', 'output_generated']);
});
