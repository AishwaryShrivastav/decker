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
  let offscreenStartCount = 0;
  let downloadCount = 0;
  const tabActions = [];
  const contextActions = [];
  const windowActions = [];
  const downloads = [];
  const chrome = {
    runtime: {
      onMessage: { addListener: fn => { listener = fn; } },
      getContexts: async filter => {
        contextActions.push(structuredClone(filter));
        return filter?.contextTypes?.includes('TAB')
          ? (options.reviewContexts ?? [])
          : [{ contextType: 'OFFSCREEN_DOCUMENT' }];
      },
      ContextType: { OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT', TAB: 'TAB' },
      getURL: p => `chrome-extension://test/${p}`,
      sendMessage: async msg => {
        if (msg.type === 'OFFSCREEN_STATUS') return options.capture ? options.capture() : options.captureGone ? undefined : { sessionId: saved?.id, active: true };
        if (msg.type === 'OFFSCREEN_START') {
          offscreenStartCount++;
          events.push(structuredClone(msg));
          return options.offscreenStart ? options.offscreenStart(msg, offscreenStartCount) : { ok: true, warnings: [] };
        }
        if (msg.type === 'OFFSCREEN_STOP') return { ok: true };
        events.push(structuredClone(msg)); return { ok: true };
      },
    },
    storage: { local: {
      get: async (keys, cb) => { if (options.hydration) await options.hydration; if (cb) cb(local); return local; },
      set: async patch => Object.assign(local, patch),
      remove: async keys => keys.forEach(key => delete local[key]),
    } },
    tabs: {
      get: async () => options.tab ?? ({ id: 1, url: 'https://meet.google.com/abc-defg-hij', audible: true, mutedInfo: { muted: false } }),
      update: async (tabId, update) => { tabActions.push({ type: 'update', tabId, update }); return { id: tabId, ...update }; },
      create: async create => { tabActions.push({ type: 'create', create }); return { id: 99, ...create }; },
      sendMessage: async () => {},
    },
    windows: { update: async (windowId, update) => { windowActions.push({ windowId, update }); return { id: windowId, ...update }; } },
    offscreen: { closeDocument: async () => { closeCount++; }, createDocument: async () => {}, Reason: { USER_MEDIA: 'USER_MEDIA' } },
    downloads: { download: async request => {
      downloadCount++;
      downloads.push(structuredClone(request));
      if (options.download) return options.download(request, downloadCount);
      return downloadCount;
    } },
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
  return { send, events, requests, local, tabActions, contextActions, windowActions, downloads, get stored() { return stored; }, get closeCount() { return closeCount; }, get offscreenStartCount() { return offscreenStartCount; } };
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

test('stopping opens the review page and focuses an existing review tab', async () => {
  const saved = freshSession('test'); saved.status = 'recording';
  const reviewUrl = 'chrome-extension://test/src/review/index.html';
  const w = worker(saved, { reviewContexts: [{ tabId: 42, windowId: 8, documentUrl: reviewUrl }] });

  assert.equal((await w.send('STOP_RECORDING')).ok, true);

  assert.deepEqual(w.contextActions, [{ contextTypes: ['TAB'], documentUrls: [reviewUrl] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(w.tabActions)), [{ type: 'update', tabId: 42, update: { active: true } }]);
  assert.deepEqual(JSON.parse(JSON.stringify(w.windowActions)), [{ windowId: 8, update: { focused: true } }]);
});

test('stopping creates the review page when none is open', async () => {
  const saved = freshSession('test'); saved.status = 'recording';
  const reviewUrl = 'chrome-extension://test/src/review/index.html';
  const w = worker(saved);

  assert.equal((await w.send('STOP_RECORDING')).ok, true);

  assert.deepEqual(w.contextActions, [{ contextTypes: ['TAB'], documentUrls: [reviewUrl] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(w.tabActions)), [{ type: 'create', create: { url: reviewUrl, active: true } }]);
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

test('stale review edits are rejected before they replace a newer transcript revision', async () => {
  const saved = freshSession('test');
  Object.assign(saved, {
    status: 'reviewing',
    transcript: 'The final transcript includes a decision made after the review page opened.',
    transcriptRevision: 3,
  });
  const w = worker(saved);

  const response = await w.send('SAVE_REVIEW', {
    sessionId: 'test',
    edit: { text: 'Older transcript draft', baseRevision: 2 },
  });

  assert.match(response.error, /transcript changed/i);
  assert.equal(w.stored.edit, undefined);
  assert.equal(w.stored.transcriptRevision, 3);
});

test('Gemini generates the selected artifact and leaves it available for review actions', async () => {
  const saved = freshSession('test');
  Object.assign(saved, {
    status: 'reviewing',
    transcript: 'The team agreed to ship on Friday after the owner signs off on the final accessibility review.',
  });
  const local = { providerSettings: { version: 1, provider: 'gemini', apiKey: 'gemini-key' } };
  const html = '<!doctype html><html><body>Gemini meeting brief</body></html>';
  const w = worker(saved, { local, fetch: async url => {
    if (url.includes(':streamGenerateContent')) {
      return new Response(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: html }] } }] })}\n\n`);
    }
    throw new Error(`Unexpected URL: ${url}`);
  } });

  assert.equal((await w.send('GENERATE_DECK', {
    sessionId: 'test',
    transcriptRevision: 0,
    transcriptEdited: false,
    selectedPoints: [],
    customPrompt: '',
    outputFormat: 'notes',
  })).ok, true);
  await until(() => w.stored?.status === 'done');

  assert.ok(w.requests.some(request => request.url.includes('generativelanguage.googleapis.com') && request.url.includes(':streamGenerateContent')));
  assert.equal(w.requests.some(request => request.url.includes('api.openai.com')), false);
  assert.equal(w.stored.html, html);
  assert.equal(w.downloads.length, 0);
  const done = w.events.find(event => event.type === 'STATUS_UPDATE' && event.payload.status === 'done');
  assert.equal(done.payload.hasHtml, true);
});

test('a saved artifact can be downloaded after restart and retried after a browser failure', async () => {
  const saved = freshSession('test');
  Object.assign(saved, {
    status: 'done',
    outputFormat: 'doc',
    html: '<!doctype html><html><body>Recovered artifact</body></html>',
  });
  const w = worker(saved, { download: async (_request, count) => {
    if (count === 1) throw new Error('Download interrupted');
    return 7;
  } });

  assert.match((await w.send('DOWNLOAD_ARTIFACT', { sessionId: 'test' })).error, /Download interrupted/);
  assert.equal((await w.send('GET_FULL_STATE')).hasHtml, true);
  assert.equal((await w.send('DOWNLOAD_ARTIFACT', { sessionId: 'test' })).ok, true);
  assert.equal(w.downloads.length, 2);
  assert.match(w.downloads[1].url, /^data:text\/html;charset=utf-8,/);
  assert.match(decodeURIComponent(w.downloads[1].url), /Recovered artifact/);
  assert.match(w.downloads[1].filename, /^decker-doc-/);
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
      return new Response(JSON.stringify({ file: { name: 'files/background-audio', uri: 'https://files.example/audio' } }));
    }
    if (url.endsWith('/v1beta/interactions')) {
      return new Response(JSON.stringify({ output_text: 'A complete Gemini meeting transcript with enough detail for topic extraction.' }));
    }
    if (url.includes(':generateContent')) {
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"points":["Gemini route"]}' }] } }] }));
    }
    if (url.endsWith('/v1beta/files/background-audio')) return new Response('{}');
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

  assert.match(response.error, /Gemini gemini-3\.5-flash generation capability check failed.*Key rejected/);
  assert.equal(w.local.providerSettings.provider, 'openai');
  assert.equal(w.local.providerSettings.apiKey, 'sk-existing');
});

test('the existing OpenAI save payload validates and updates provider settings', async () => {
  const saved = freshSession('test');
  const local = { openaiKey: 'sk-existing' };
  const models = [];
  const w = worker(saved, { local, fetch: async (url, init) => {
    assert.equal(init.headers.Authorization, 'Bearer sk-new');
    if (url.endsWith('/chat/completions')) {
      models.push(JSON.parse(init.body).model);
      return new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }));
    }
    if (url.endsWith('/audio/transcriptions')) {
      assert.equal(init.body.get('model'), 'whisper-1');
      return new Response(JSON.stringify({ text: '' }));
    }
    throw new Error(`Unexpected URL: ${url}`);
  } });

  assert.equal((await w.send('SET_API_SETTINGS', { openaiKey: '  sk-new  ' })).ok, true);
  assert.deepEqual(models, ['gpt-4o-mini', 'gpt-4o']);
  assert.equal(w.local.openaiKey, 'sk-new');
  assert.equal(w.local.providerSettings.provider, 'openai');
  assert.equal(w.local.providerSettings.apiKey, 'sk-new');
});

test('explicit provider clear removes credentials and resets the cached adapter', async () => {
  const saved = freshSession('test');
  const local = {
    providerSettings: { version: 1, provider: 'gemini', apiKey: 'gemini-existing' },
    openaiKey: 'sk-existing',
  };
  const w = worker(saved, { local });

  assert.equal((await w.send('CLEAR_PROVIDER_SETTINGS')).ok, true);

  assert.equal('providerSettings' in w.local, false);
  assert.equal('openaiKey' in w.local, false);
  const settings = await w.send('GET_API_SETTINGS');
  assert.equal(settings.provider, 'openai');
  assert.equal(settings.apiKey, '');
  assert.equal(settings.openaiKey, '');
  assert.match((await w.send('PREFLIGHT')).error, /OpenAI key/);
});

function successfulProviderValidation(url) {
  if (url.includes('api.openai.com') && url.endsWith('/chat/completions')) {
    return new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }));
  }
  if (url.includes('api.openai.com') && url.endsWith('/audio/transcriptions')) {
    return new Response(JSON.stringify({ text: '' }));
  }
  if (url.endsWith('/upload/v1beta/files')) {
    return new Response('{}', { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/validation' } });
  }
  if (url.endsWith('/upload/validation')) {
    return new Response(JSON.stringify({ file: { name: 'files/validation', uri: 'https://files.example/validation' } }));
  }
  if (url.endsWith('/v1beta/interactions')) return new Response(JSON.stringify({ output_text: '' }));
  if (url.endsWith('/v1beta/files/validation')) return new Response('{}');
  if (url.includes(':generateContent')) return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '' }] } }] }));
  throw new Error(`Unexpected validation URL: ${url}`);
}

test('a clear requested after a delayed save wins in provider mutation order', async () => {
  let release;
  let validationStarted = false;
  const gate = new Promise(resolve => { release = resolve; });
  const local = { openaiKey: 'sk-existing' };
  const w = worker(freshSession('test'), { local, fetch: async (url) => {
    validationStarted = true;
    await gate;
    return successfulProviderValidation(url);
  } });

  const save = w.send('SET_API_SETTINGS', { provider: 'openai', apiKey: 'sk-delayed' });
  await until(() => validationStarted);
  const clear = w.send('CLEAR_PROVIDER_SETTINGS');
  release();
  assert.equal((await save).ok, true);
  assert.equal((await clear).ok, true);
  assert.equal('providerSettings' in local, false);
  assert.equal('openaiKey' in local, false);
});

test('a provider change requested after a delayed save wins in provider mutation order', async () => {
  let release;
  let delayedStarted = false;
  const gate = new Promise(resolve => { release = resolve; });
  const local = { openaiKey: 'sk-existing' };
  const w = worker(freshSession('test'), { local, fetch: async (url, init) => {
    if (init?.headers?.Authorization === 'Bearer sk-delayed') {
      delayedStarted = true;
      await gate;
    }
    return successfulProviderValidation(url);
  } });

  const first = w.send('SET_API_SETTINGS', { provider: 'openai', apiKey: 'sk-delayed' });
  await until(() => delayedStarted);
  const second = w.send('SET_API_SETTINGS', { provider: 'gemini', apiKey: 'gemini-latest' });
  release();
  assert.equal((await first).ok, true);
  assert.equal((await second).ok, true);
  assert.deepEqual(local.providerSettings, { version: 1, provider: 'gemini', apiKey: 'gemini-latest' });
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

test('background accepts supported browser meetings with audio warnings and rejects unsupported tabs', async () => {
  const audible = worker(freshSession('test'), { tab: { id: 1, url: 'https://calls.example.org/room', audible: true, mutedInfo: { muted: false } } });
  assert.equal((await audible.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'stream', includeMicrophone: false })).ok, true);

  const muted = worker(freshSession('test'), { tab: { id: 1, url: 'https://app.zoom.us/wc/1', audible: true, mutedInfo: { muted: true } } });
  assert.equal((await muted.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'stream', includeMicrophone: true })).ok, true);
  await until(() => muted.stored?.status === 'recording');
  assert.match(muted.stored.warnings.join(' '), /muted.*capture.*silent/i);

  const unsupported = worker(freshSession('test'), { tab: { id: 1, url: 'chrome://settings', audible: true } });
  assert.match((await unsupported.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'stream', includeMicrophone: true })).error, /browser does not allow/);
  assert.equal(unsupported.offscreenStartCount, 0);

  const inactive = worker(freshSession('test'), { tab: { id: 1, active: false, url: 'https://meet.google.com/a', audible: true } });
  assert.match((await inactive.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'stream', includeMicrophone: true })).error, /active meeting tab/);
  assert.equal(inactive.offscreenStartCount, 0);
});

test('capture source, microphone choice, and session generation survive reopening', async () => {
  const first = worker(freshSession('test', 4), { tab: { id: 1, url: 'https://app.zoom.us/wc/1', audible: false, mutedInfo: { muted: false } } });
  assert.equal((await first.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'stream', includeMicrophone: false })).ok, true);
  await until(() => first.stored?.status === 'recording');
  const live = await first.send('GET_FULL_STATE');
  assert.equal(live.sessionGeneration, 5);
  assert.equal(live.captureSource.tabId, 1);
  assert.equal(live.captureSource.name, 'Zoom Web');
  assert.equal(live.includeMicrophone, false);
  assert.match(live.warnings.join(' '), /No tab audio.*captured signal/i);

  const reopened = worker(first.stored);
  const restored = await reopened.send('GET_FULL_STATE');
  assert.equal(restored.sessionGeneration, 5);
  assert.equal(restored.captureSource.tabId, 1);
  assert.equal(restored.captureSource.name, 'Zoom Web');
  assert.equal(restored.includeMicrophone, false);
});

test('capture denial gives recovery steps, leaves a recoverable session, and allows retry', async () => {
  const saved = freshSession('test');
  const w = worker(saved, { offscreenStart: (_msg, count) => count === 1
    ? { error: 'Tab capture permission was denied.' }
    : { ok: true, warnings: [] } });

  const denied = await w.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'denied', includeMicrophone: true });
  assert.match(denied.error, /permission was denied/i);
  assert.match(denied.error, /Select the meeting tab.*audio is playing.*reopen Decker.*try again/i);
  await until(() => w.stored?.status === 'error');
  assert.equal(w.stored.message, denied.error);
  assert.equal((await w.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'retry', includeMicrophone: false })).ok, true);
  await until(() => w.stored?.status === 'recording');
  assert.equal(w.offscreenStartCount, 2);
  const startMessages = w.events.filter(event => event.type === 'OFFSCREEN_START');
  assert.equal(startMessages.at(-1).payload.includeMicrophone, false);
});

test('background start failures are normalized without losing the durable error state', async () => {
  const saved = freshSession('test');
  const w = worker(saved, { offscreenStart: () => ({ error: 'Audio device failed unexpectedly.' }) });

  const failed = await w.send('START_RECORDING_WITH_STREAM', { tabId: 1, streamId: 'stream', includeMicrophone: true });

  assert.match(failed.error, /Audio capture did not start/i);
  assert.match(failed.error, /Select the meeting tab.*audio is playing.*reopen Decker.*try again/i);
  assert.doesNotMatch(failed.error, /device failed unexpectedly/i);
  await until(() => w.stored?.status === 'error');
  assert.equal(w.stored.message, failed.error);
});
