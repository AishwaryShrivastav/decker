const { test } = require('node:test');
const assert = require('node:assert/strict');
const { freshSession, transcriptForGeneration, processPendingChunks, recoverSession, reconcileTopics, addCaptureNotice } = require('../src/shared/capture.ts');
const { AudioDelivery } = require('../src/offscreen/delivery.ts');
const chunk = (sequence, base64 = 'audio') => ({ sessionId: 'session', sequence, base64, mimeType: 'audio/webm', attempts: 0 });

test('a delayed live send finishes before the final marker, including an empty tail', async () => {
  const delivered = [];
  let release;
  const gate = new Promise(r => { release = r; });
  const delivery = new AudioDelivery('session', async (type, payload) => {
    if (payload.sequence === 0) await gate;
    delivered.push({ type, payload });
    return { ok: true };
  }, async () => {});
  delivery.enqueue(async () => 'first', 'audio/webm');
  const done = delivery.finish(async () => '', 'audio/webm');
  await Promise.resolve();
  assert.equal(delivered.length, 0);
  release();
  await done;
  assert.deepEqual(delivered.map(x => x.type), ['AUDIO_CHUNK', 'RECORDING_STOPPED']);
  assert.equal(delivered[1].payload.base64, '');
  assert.equal(delivered[1].payload.sequence, 1);
});

test('final chunk uses the same queue and survives retry exhaustion of an earlier chunk', async () => {
  const state = freshSession('session');
  state.status = 'processing';
  state.queue = [chunk(0), chunk(1, 'final')];
  let attempts = 0;
  await processPendingChunks(state, async c => {
    if (c.sequence === 0) { attempts++; throw new Error('offline'); }
    return 'The final decision was to ship on Friday.';
  }, async () => {}, async () => {}, () => {});
  assert.equal(attempts, 3);
  assert.equal(state.queue.length, 0);
  assert.match(state.transcript, /Missing audio segment 1/);
  assert.match(state.transcript, /final decision/);
  assert.equal(state.warnings.length, 1);
  assert.equal(state.status, 'processing');
});

test('transcription retries can succeed without duplicating text', async () => {
  const state = freshSession('session');
  state.queue = [chunk(0)];
  let attempts = 0;
  await processPendingChunks(state, async () => {
    if (++attempts < 3) throw new Error('temporary');
    return 'Recovered words';
  }, async () => {}, async () => {}, () => {});
  assert.equal(state.transcript, 'Recovered words');
  assert.deepEqual(state.warnings, []);
});

test('stale edits cannot replace newer final transcript; matching explicit edits and empty edits are respected', () => {
  const state = freshSession('session');
  state.transcript = 'Live text. Final decision.';
  state.transcriptRevision = 2;
  assert.equal(transcriptForGeneration(state, { text: 'Live text.', baseRevision: 1 }), state.transcript);
  assert.equal(transcriptForGeneration(state, { text: 'Corrected final decision.', baseRevision: 2 }), 'Corrected final decision.');
  assert.equal(transcriptForGeneration(state, { text: '', baseRevision: 2 }), '');
});

test('restart restores pending attempts, transcript, deliberate deselections and custom instructions', async () => {
  const original = freshSession('session', 7);
  Object.assign(original, { status: 'recording', transcript: 'Earlier words', transcriptRevision: 1,
    points: ['A', 'B'], selectedPoints: ['B'], customPrompt: 'Include owners', outputFormat: 'doc',
    edit: { text: 'Edited earlier words', baseRevision: 1 }, queue: [{ ...chunk(1), attempts: 2 }],
    captureSource: { tabId: 19, name: 'Zoom Web' }, includeMicrophone: false });
  const state = recoverSession(structuredClone(original));
  assert.equal(state.status, 'recording');
  assert.equal(state.generation, 7);
  assert.deepEqual(state.captureSource, { tabId: 19, name: 'Zoom Web' });
  assert.equal(state.includeMicrophone, false);
  assert.deepEqual(state.selectedPoints, ['B']);
  assert.equal(state.customPrompt, 'Include owners');
  assert.deepEqual(state.edit, original.edit);
  let attempts = 0;
  await processPendingChunks(state, async () => { attempts++; throw new Error('offline'); }, async () => {}, async () => {}, () => {});
  assert.equal(attempts, 1);
  assert.match(state.transcript, /^Earlier words/);
});

test('legacy recovery sessions receive ordered capture defaults', () => {
  const legacy = freshSession('legacy');
  delete legacy.generation;
  delete legacy.captureSource;
  delete legacy.includeMicrophone;
  const recovered = recoverSession(legacy);
  assert.equal(recovered.generation, 0);
  assert.equal(recovered.captureSource, null);
  assert.equal(recovered.includeMicrophone, true);
});

test('topic reordering preserves explicit deselections and selects only new topics', () => {
  const state = freshSession('session');
  state.points = ['A', 'B']; state.selectedPoints = ['B'];
  reconcileTopics(state, ['B', 'A', 'C']);
  assert.deepEqual(state.selectedPoints, ['B', 'C']);
});

test('interrupted generation becomes reviewable and capture warning is included safely in HTML', () => {
  const state = freshSession('session'); state.status = 'generating'; state.transcript = 'Recovered';
  assert.equal(recoverSession(state).status, 'reviewing');
  const html = addCaptureNotice('<html><body>Document</body></html>', ['Missing segment <1>']);
  assert.match(html, /Capture warnings/);
  assert.match(html, /Missing segment &lt;1&gt;/);
});

test('a recovery probe does not report final delivery complete before the marker exists', async () => {
  let release;
  const gate = new Promise(r => { release = r; });
  const delivery = new AudioDelivery('session', async () => ({ ok: true }), async () => {});
  delivery.enqueue(async () => { await gate; return 'audio'; }, 'audio/webm');
  const done = delivery.finish(async () => 'tail', 'audio/webm');
  assert.equal(await delivery.resendFinal(), false);
  release();
  await done;
  assert.equal(await delivery.resendFinal(), true);
});

test('failed audio delivery is bounded and its segment number reaches the final marker', async () => {
  let attempts = 0;
  let final;
  const delivery = new AudioDelivery('session', async (type, payload) => {
    if (type === 'AUDIO_CHUNK') { attempts++; throw new Error('worker unavailable'); }
    final = payload;
    return { ok: true };
  }, async () => {});
  delivery.enqueue(async () => 'audio', 'audio/webm');
  await delivery.finish(async () => 'tail', 'audio/webm');
  assert.equal(attempts, 3);
  assert.deepEqual(final.missingSequences, [0]);
});
