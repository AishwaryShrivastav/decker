const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { freshSession } = require('../src/shared/capture.ts');

const turn = () => new Promise(r => setImmediate(r));
async function until(check) { for (let i = 0; i < 100; i++) { if (check()) return; await turn(); } throw new Error('Expected worker state did not arrive'); }

function worker(saved, options = {}) {
  let listener;
  let stored = saved && structuredClone(saved);
  const events = [];
  const requests = [];
  let closeCount = 0;
  const module = { exports: {} };
  const local = options.local ?? { openaiKey: options.noKey ? '' : 'test-only-key' };
  const chrome = {
    runtime: {
      onMessage: { addListener: fn => { listener = fn; } },
      getContexts: async () => [{ contextType: 'OFFSCREEN_DOCUMENT' }],
      ContextType: { OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT' },
      getURL: p => `chrome-extension://test/${p}`,
      sendMessage: async msg => {
        if (msg.type === 'OFFSCREEN_STATUS') return options.capture ? options.capture() : options.captureGone ? undefined : { sessionId: saved?.id, active: true };
        if (msg.type === 'OFFSCREEN_START') return { ok: true, warnings: [] };
        if (msg.type === 'OFFSCREEN_STOP') return { ok: true };
        events.push(structuredClone(msg)); return { ok: true };
      },
    },
    storage: { local: {
      get: async (keys, cb) => { if (options.hydration) await options.hydration; if (cb) cb(local); return local; },
      set: async patch => Object.assign(local, patch),
    } },
    tabs: { get: async () => ({ url: 'https://meet.google.com/abc-defg-hij' }), sendMessage: async () => {} },
    offscreen: { closeDocument: async () => { closeCount++; }, createDocument: async () => {}, Reason: { USER_MEDIA: 'USER_MEDIA' } },
    downloads: { download: async () => 1 },
  };
  const fetch = async (url, init) => {
    requests.push({ url, init });
    if (options.fetch) return options.fetch(url, init);
    if (url.endsWith('/models')) return { ok: true, json: async () => ({ data: [] }) };
    if (url.endsWith('/audio/transcriptions')) return { ok: true, json: async () => ({ text: await init.body.get('file').text() }) };
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"points":["Shipping"]}' } }] }) };
  };
  const filename = path.resolve(__dirname, '../src/background/index.ts');
  const context = vm.createContext({ module, exports: module.exports, chrome, fetch,
    console: { log() {}, error() {}, warn() {} }, crypto, structuredClone, URL, Blob, File, FormData,
    AbortSignal, atob, Uint8Array, TextDecoder, setTimeout, clearTimeout,
    require: id => id === '../shared/sessionStore' ? {
      loadSession: async () => saved && structuredClone(saved),
      saveSession: async state => { if (options.saveGate) await options.saveGate(); stored = structuredClone(state); },
    } : require(path.resolve(path.dirname(filename), id)),
  });
  vm.runInContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  const send = (type, payload) => new Promise(resolve => listener({ type, payload }, {}, resolve));
  return { send, events, requests, local, get stored() { return stored; }, get closeCount() { return closeCount; } };
}

const audio = (sequence, text = 'Final decision: release Friday after the owner signs off.') => ({ sessionId: 'test', sequence, base64: Buffer.from(text).toString('base64'), mimeType: 'audio/webm' });

test('worker stop drains the final segment, keeps it on extraction failure, and deduplicates redelivery', async () => {
  const saved = freshSession('test'); saved.status = 'recording'; saved.transcript = 'Earlier discussion.';
  let transcriptions = 0;
  const w = worker(saved, { fetch: async (url, init) => {
    if (url.endsWith('/audio/transcriptions')) { transcriptions++; return { ok: true, json: async () => ({ text: await init.body.get('file').text() }) }; }
    throw new Error('Topic API unavailable');
  } });
  await w.send('GET_FULL_STATE');
  await w.send('STOP_RECORDING');
  assert.equal((await w.send('RECORDING_STOPPED', audio(0))).ok, true);
  await until(() => w.stored?.status === 'reviewing');
  const state = await w.send('GET_FULL_STATE');
  assert.match(state.transcript, /Earlier discussion.*Final decision/);
  assert.match(state.warnings.join(' '), /Topic extraction failed/);
  assert.equal((await w.send('RECORDING_STOPPED', audio(0))).ok, true);
  await turn();
  assert.equal(transcriptions, 1);
  assert.equal(w.stored.queue.length, 0);
  assert.equal(w.closeCount, 1);
});

test('an empty tail completes review without retranscribing the first segment', async () => {
  const saved = freshSession('test'); saved.status = 'recording'; saved.transcript = 'Already saved meeting words.'; saved.lastSequence = 0;
  const w = worker(saved);
  await w.send('GET_FULL_STATE');
  await w.send('RECORDING_STOPPED', { ...audio(1), base64: '' });
  await until(() => w.stored?.status === 'reviewing');
  assert.equal(w.requests.filter(r => r.url.endsWith('/audio/transcriptions')).length, 0);
  assert.equal((await w.send('GET_FULL_STATE')).transcript, saved.transcript);
});

test('hydration gates requests and restart restores review inputs and queued audio', async () => {
  const saved = freshSession('test');
  Object.assign(saved, { status: 'recording', transcript: 'Earlier words.', points: ['A', 'B'], selectedPoints: ['B'],
    customPrompt: 'Include owners', edit: { text: 'An explicit edit', baseRevision: 0 }, queue: [{ ...audio(0), attempts: 0 }], lastSequence: 0 });
  let release;
  const w = worker(saved, { hydration: new Promise(r => { release = r; }) });
  let resolved = false;
  const pending = w.send('GET_FULL_STATE').then(r => { resolved = true; return r; });
  await turn(); assert.equal(resolved, false);
  release();
  const state = await pending;
  assert.deepEqual(state.selectedPoints, ['B']);
  assert.equal(state.customPrompt, 'Include owners');
  assert.equal(state.edit.text, 'An explicit edit');
  await until(() => w.stored?.transcript.includes('Final decision'));
  assert.equal(w.stored.queue.length, 0);
});

test('audio acknowledgement waits for durable persistence', async () => {
  const saved = freshSession('test'); saved.status = 'recording';
  let release;
  let gated = false;
  const gate = new Promise(r => { release = r; });
  const w = worker(saved, { saveGate: () => gated ? gate : Promise.resolve() });
  await w.send('GET_FULL_STATE'); await turn();
  gated = true;
  let acked = false;
  const pending = w.send('AUDIO_CHUNK', audio(0)).then(() => { acked = true; });
  await turn(); assert.equal(acked, false);
  release(); await pending;
  assert.equal(w.stored.lastSequence, 0);
});

test('stale generation payload is rejected and unedited payload uses the canonical final transcript', async () => {
  const saved = freshSession('test'); saved.status = 'reviewing'; saved.transcriptRevision = 2;
  saved.transcript = 'The complete transcript contains the final decision to ship on Friday.';
  const w = worker(saved, { fetch: async (_url, init) => {
    const text = '<!doctype html><html><body>Meeting brief</body></html>';
    const encoder = new TextEncoder();
    return { ok: true, body: new ReadableStream({ start(controller) {
      controller.enqueue(encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\n\ndata: [DONE]\n\n'));
      controller.close();
    } }) };
  } });
  const request = { sessionId: 'test', selectedPoints: [], customPrompt: 'Include owners', outputFormat: 'notes', transcript: 'Stale live words', transcriptRevision: 1, transcriptEdited: true };
  assert.match((await w.send('GENERATE_DECK', request)).error, /transcript changed/);
  assert.equal(w.requests.length, 0);
  assert.equal((await w.send('GENERATE_DECK', { ...request, transcriptEdited: false })).ok, true);
  await until(() => w.stored?.status === 'done');
  assert.match(w.requests[0].init.body, /final decision to ship on Friday/);
  assert.doesNotMatch(w.requests[0].init.body, /Stale live words/);
});

test('missing recorder recovers the existing transcript with an interruption warning', async () => {
  const saved = freshSession('test'); saved.status = 'recording'; saved.transcript = 'Saved before the crash.';
  const w = worker(saved, { captureGone: true });
  await until(() => w.stored?.status === 'reviewing');
  assert.equal(w.stored.transcript, saved.transcript);
  assert.match(w.stored.warnings.join(' '), /interrupted/);
});

test('key preflight fails before capture and old-session audio is refused', async () => {
  const saved = freshSession('test');
  const w = worker(saved, { noKey: true });
  assert.match((await w.send('PREFLIGHT')).error, /OpenAI key/);
  assert.match((await w.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'unused' })).error, /OpenAI key/);
  assert.match((await w.send('AUDIO_CHUNK', { ...audio(0), sessionId: 'expired' })).error, /Expired/);
  assert.equal(w.requests.length, 0);
});

test('legacy OpenAI settings preserve the current provider and request path', async () => {
  const saved = freshSession('test'); saved.status = 'recording';
  const w = worker(saved, { local: { openaiKey: 'sk-existing' } });

  const settings = await w.send('GET_API_SETTINGS');
  assert.equal(settings.provider, 'openai');
  assert.equal(settings.apiKey, 'sk-existing');
  assert.equal(settings.openaiKey, 'sk-existing');
  assert.deepEqual(w.local.providerSettings, { version: 1, provider: 'openai', apiKey: 'sk-existing' });

  await w.send('RECORDING_STOPPED', audio(0));
  await until(() => w.stored?.status === 'reviewing');
  assert.ok(w.requests.some(request => request.url === 'https://api.openai.com/v1/audio/transcriptions'));
});

test('Gemini settings route transcription and text generation through Gemini', async () => {
  const saved = freshSession('test'); saved.status = 'recording';
  const local = { providerSettings: { version: 1, provider: 'gemini', apiKey: 'gemini-key' } };
  const w = worker(saved, { local, fetch: async (url) => {
    if (url.endsWith('/upload/v1beta/files')) {
      return new Response('{}', { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/session' } });
    }
    if (url.endsWith('/upload/session')) {
      return new Response(JSON.stringify({ file: { uri: 'https://files.example/audio' } }));
    }
    if (url.endsWith('/v1beta/interactions')) {
      return new Response(JSON.stringify({ output_text: 'A complete Gemini meeting transcript with enough detail for topic extraction.' }));
    }
    if (url.includes(':generateContent')) {
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"points":["Gemini route"]}' }] } }] }));
    }
    throw new Error(`Unexpected URL: ${url}`);
  } });

  await w.send('RECORDING_STOPPED', audio(0));
  await until(() => w.stored?.status === 'reviewing');

  assert.equal((await w.send('GET_API_SETTINGS')).provider, 'gemini');
  assert.ok(w.requests.some(request => request.url.endsWith('/v1beta/interactions')));
  assert.ok(w.requests.some(request => request.url.includes(':generateContent')));
  assert.equal(w.requests.some(request => request.url.includes('api.openai.com')), false);
});

test('provider keys are validated before settings are saved', async () => {
  const saved = freshSession('test');
  const local = { openaiKey: 'sk-existing' };
  const w = worker(saved, { local, fetch: async () => new Response(JSON.stringify({
    error: { message: 'Key rejected' },
  }), { status: 401 }) });

  const response = await w.send('SET_API_SETTINGS', { provider: 'gemini', apiKey: 'bad-key' });

  assert.match(response.error, /Gemini key validation failed.*Key rejected/);
  assert.equal(w.local.providerSettings.provider, 'openai');
  assert.equal(w.local.providerSettings.apiKey, 'sk-existing');
});

test('the existing OpenAI save payload validates and updates provider settings', async () => {
  const saved = freshSession('test');
  const local = { openaiKey: 'sk-existing' };
  const w = worker(saved, { local, fetch: async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/models');
    assert.equal(init.headers.Authorization, 'Bearer sk-new');
    return new Response(JSON.stringify({ data: [] }));
  } });

  assert.equal((await w.send('SET_API_SETTINGS', { openaiKey: '  sk-new  ' })).ok, true);
  assert.equal(w.local.openaiKey, 'sk-new');
  assert.equal(w.local.providerSettings.provider, 'openai');
  assert.equal(w.local.providerSettings.apiKey, 'sk-new');
});


test('reopening the popup probes a stalled final delivery even when the worker is still alive', async () => {
  const saved = freshSession('test'); saved.status = 'processing';
  let allowRecovery = false;
  let w;
  w = worker(saved, { capture: () => {
    if (allowRecovery) {
      allowRecovery = false;
      void w.send('RECORDING_STOPPED', audio(0));
    }
    return { sessionId: 'test', active: false, finishing: true };
  } });
  await w.send('GET_FULL_STATE'); await turn();
  allowRecovery = true;
  await w.send('GET_FULL_STATE');
  await until(() => w.stored?.status === 'reviewing');
  assert.match(w.stored.transcript, /Final decision/);
});
