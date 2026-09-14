const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const turn = () => new Promise(r => setImmediate(r));

function recorderHarness({ denyMic = false, noTabAudio = false } = {}) {
  let listener;
  const messages = [];
  const timers = new Map();
  const recorders = [];
  let contextsClosed = 0;
  let timerId = 0;
  const makeTrack = () => ({ readyState: 'live', muted: false, stop() { this.readyState = 'ended'; } });
  const tabTrack = makeTrack(); const micTrack = makeTrack();
  const stream = tracks => ({ getAudioTracks: () => tracks, getTracks: () => tracks });
  class FakeRecorder {
    static isTypeSupported() { return true; }
    constructor() { this.state = 'inactive'; recorders.push(this); }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      queueMicrotask(() => {
        this.ondataavailable({ data: new Blob([`segment-${recorders.indexOf(this)}`]) });
        this.onstop();
      });
    }
  }
  class AudioContext {
    state = 'running'; destination = {};
    createMediaStreamSource() { return { connect() {} }; }
    createMediaStreamDestination() { return { stream: stream([makeTrack()]) }; }
    createAnalyser() { return { fftSize: 8, getByteTimeDomainData(a) { a.fill(129); } }; }
    async close() { this.state = 'closed'; contextsClosed++; }
  }
  class FileReader {
    async readAsDataURL(blob) { this.result = 'data:audio/webm;base64,' + Buffer.from(await blob.arrayBuffer()).toString('base64'); this.onload(); }
  }
  const filename = path.resolve(__dirname, '../src/offscreen/index.ts');
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports, console, Blob, FileReader, AudioContext,
    MediaRecorder: FakeRecorder,
    navigator: { mediaDevices: { getUserMedia: async constraints => {
      if (constraints.audio === true) { if (denyMic) throw new Error('Denied'); return stream([micTrack]); }
      return stream(noTabAudio ? [] : [tabTrack]);
    } } },
    chrome: { runtime: { onMessage: { addListener: fn => { listener = fn; } }, sendMessage: async msg => { messages.push(msg); return { ok: true }; } } },
    Uint8Array, setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id),
    require: id => require(path.resolve(path.dirname(filename), id)),
  });
  vm.runInContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  const send = (type, payload) => new Promise(resolve => listener({ type, payload }, {}, resolve));
  return { send, messages, recorders, timers, tabTrack, micTrack, get contextsClosed() { return contextsClosed; } };
}

test('a short final blob is delivered even below the old size threshold, and audio sources are released', async () => {
  const h = recorderHarness();
  assert.equal((await h.send('OFFSCREEN_START', { sessionId: 'test', streamId: 'test-stream' })).ok, true);
  await h.send('OFFSCREEN_STOP');
  await turn();
  const stopped = h.messages.find(m => m.type === 'RECORDING_STOPPED');
  assert.equal(Buffer.from(stopped.payload.base64, 'base64').toString(), 'segment-0');
  assert.equal(h.contextsClosed, 1);
  assert.equal(h.tabTrack.readyState, 'ended');
  assert.equal(h.micTrack.readyState, 'ended');
});

test('independent recorder segments do not prepend or replay the first audio', async () => {
  const h = recorderHarness();
  await h.send('OFFSCREEN_START', { sessionId: 'test', streamId: 'test-stream' });
  [...h.timers.values()].find(t => t.ms === 16000).fn();
  await turn();
  assert.equal(h.recorders.length, 2);
  await h.send('OFFSCREEN_STOP'); await turn();
  const chunks = h.messages.filter(m => ['AUDIO_CHUNK', 'RECORDING_STOPPED'].includes(m.type));
  assert.deepEqual(chunks.map(m => Buffer.from(m.payload.base64, 'base64').toString()), ['segment-0', 'segment-1']);
});

test('stop during a queued rotation treats that segment as final and does not restart the recorder', async () => {
  const h = recorderHarness();
  await h.send('OFFSCREEN_START', { sessionId: 'test', streamId: 'test-stream' });
  [...h.timers.values()].find(t => t.ms === 16000).fn();
  // Send synchronously before MediaRecorder's queued stop event.
  const done = h.send('OFFSCREEN_STOP');
  await done; await turn();
  assert.equal(h.recorders.length, 1);
  assert.deepEqual(h.messages.map(m => m.type), ['RECORDING_STOPPED']);
});

test('actual microphone denial is returned to the worker and missing tab audio prevents recording', async () => {
  const h = recorderHarness({ denyMic: true });
  const started = await h.send('OFFSCREEN_START', { sessionId: 'test', streamId: 'test-stream' });
  assert.match(started.warnings[0], /Microphone unavailable/);
  await h.send('OFFSCREEN_STOP'); await turn();
  const missing = recorderHarness({ noTabAudio: true });
  assert.match((await missing.send('OFFSCREEN_START', { sessionId: 'test', streamId: 'test-stream' })).error, /No tab audio/);
  assert.equal(missing.recorders.length, 0);
});
