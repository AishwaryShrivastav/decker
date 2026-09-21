const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createProviderAdapter } = require('../src/providers/registry.ts');
const { readSseText } = require('../src/providers/http.ts');

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

function sseResponse(events) {
  return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') + 'data: [DONE]\n\n');
}

test('registry creates only the supported providers', () => {
  assert.equal(createProviderAdapter({ provider: 'openai', apiKey: 'key' }, async () => {}).id, 'openai');
  assert.equal(createProviderAdapter({ provider: 'gemini', apiKey: 'key' }, async () => {}).id, 'gemini');
  assert.throws(() => createProviderAdapter({ provider: 'claude', apiKey: 'key' }, async () => {}), /Unsupported provider/);
});

test('Chrome grants host access only to the two provider APIs', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/manifest.json'), 'utf8'));
  assert.deepEqual(manifest.host_permissions.sort(), [
    'https://api.openai.com/*',
    'https://generativelanguage.googleapis.com/*',
  ]);
});

test('OpenAI validation probes both generation models and transcription capability', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'openai', apiKey: 'sk-test' }, async (url, init) => {
    requests.push({ url, init });
    if (url.endsWith('/chat/completions')) return jsonResponse({ choices: [{ message: { content: '' } }] });
    if (url.endsWith('/audio/transcriptions')) return jsonResponse({ text: '' });
    throw new Error(`Unexpected URL: ${url}`);
  });

  await provider.validateKey();

  assert.deepEqual(requests.map(request => request.url), [
    'https://api.openai.com/v1/chat/completions',
    'https://api.openai.com/v1/chat/completions',
    'https://api.openai.com/v1/audio/transcriptions',
  ]);
  assert.deepEqual(requests.slice(0, 2).map(request => JSON.parse(request.init.body).model), ['gpt-4o-mini', 'gpt-4o']);
  assert.deepEqual(requests.slice(0, 2).map(request => JSON.parse(request.init.body).max_tokens), [1, 1]);
  assert.equal(requests[2].init.body.get('model'), 'whisper-1');
  assert.equal(requests[2].init.body.get('file').name, 'validation.wav');
  assert.equal(requests[2].init.body.get('file').type, 'audio/wav');
});

test('OpenAI validation reports the exact unavailable generation capability without exposing the key', async () => {
  const provider = createProviderAdapter({ provider: 'openai', apiKey: 'sk-private' }, async () =>
    jsonResponse({ error: { message: 'Model access denied' } }, { status: 403 })
  );

  await assert.rejects(provider.validateKey(), err => {
    assert.match(err.message, /OpenAI gpt-4o-mini generation capability check failed.*Model access denied/);
    assert.doesNotMatch(err.message, /sk-private/);
    return true;
  });
});

test('OpenAI validation reports unavailable transcription after generation probes succeed', async () => {
  let generationCalls = 0;
  const provider = createProviderAdapter({ provider: 'openai', apiKey: 'sk-test' }, async (url) => {
    if (url.endsWith('/chat/completions')) {
      generationCalls++;
      return jsonResponse({ choices: [{ message: { content: '' } }] });
    }
    return jsonResponse({ error: { message: 'Whisper unavailable' } }, { status: 403 });
  });

  await assert.rejects(provider.validateKey(), /OpenAI transcription capability check failed.*Whisper unavailable/);
  assert.equal(generationCalls, 2);
});

test('OpenAI preserves current transcription and text generation behavior', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'openai', apiKey: 'sk-test' }, async (url, init) => {
    requests.push({ url, init });
    if (url.endsWith('/audio/transcriptions')) return jsonResponse({ text: '  transcript  ' });
    if (JSON.parse(init.body).stream) {
      return sseResponse([
        { choices: [{ delta: { content: 'Hello ' } }] },
        { choices: [{ delta: { content: 'world' } }] },
      ]);
    }
    return jsonResponse({ choices: [{ message: { content: 'complete' } }] });
  });

  assert.equal(await provider.transcribe(new Blob(['audio'], { type: 'audio/webm;codecs=opus' })), 'transcript');
  assert.equal(await provider.complete({ systemPrompt: 'system', userMessage: 'user', model: 'mini' }), 'complete');
  assert.equal(await provider.stream({ systemPrompt: 'system', userMessage: 'user', model: 'full' }), 'Hello world');

  const form = requests[0].init.body;
  assert.equal(form.get('model'), 'whisper-1');
  assert.equal(form.get('language'), 'en');
  assert.equal(form.get('file').name, 'audio.webm');
  assert.equal(JSON.parse(requests[1].init.body).model, 'gpt-4o-mini');
  assert.equal(JSON.parse(requests[2].init.body).model, 'gpt-4o');
});

test('Gemini validation probes both generation models and transcription capability', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url, init) => {
    requests.push({ url, init });
    if (url.includes(':generateContent')) return jsonResponse({ candidates: [{ content: { parts: [{ text: '' }] } }] });
    if (url.endsWith('/upload/v1beta/files')) {
      return jsonResponse({}, { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/validation' } });
    }
    if (url.endsWith('/upload/validation')) {
      return jsonResponse({ file: { name: 'files/validation-audio', uri: 'https://files.example/validation-audio' } });
    }
    if (url.endsWith('/v1beta/interactions')) return jsonResponse({ output_text: '' });
    if (url.endsWith('/v1beta/files/validation-audio')) return jsonResponse({});
    throw new Error(`Unexpected URL: ${url}`);
  });

  await provider.validateKey();

  assert.match(requests[0].url, /models\/gemini-3\.5-flash:generateContent$/);
  assert.match(requests[1].url, /models\/gemini-3\.8-flash:generateContent$/);
  assert.deepEqual(requests.slice(0, 2).map(request => JSON.parse(request.init.body).generationConfig.maxOutputTokens), [1, 1]);
  assert.ok(requests.some(request => request.url.endsWith('/v1beta/interactions')));
  assert.equal(requests[0].init.headers['x-goog-api-key'], 'gemini-key');
});

test('Gemini validation reports unavailable transcription after generation probes succeed', async () => {
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url) => {
    if (url.includes(':generateContent')) return jsonResponse({ candidates: [] });
    if (url.endsWith('/upload/v1beta/files')) {
      return jsonResponse({}, { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/validation' } });
    }
    if (url.endsWith('/upload/validation')) {
      return jsonResponse({ file: { name: 'files/validation-failure', uri: 'https://files.example/validation-failure' } });
    }
    if (url.endsWith('/v1beta/interactions')) {
      return jsonResponse({ error: { message: 'Transcription access denied' } }, { status: 403 });
    }
    if (url.endsWith('/v1beta/files/validation-failure')) return jsonResponse({});
    throw new Error(`Unexpected URL: ${url}`);
  });

  await assert.rejects(provider.validateKey(), /Gemini transcription capability check failed.*Transcription access denied/);
});

test('Gemini uploads audio and uses the transcription interaction', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url, init) => {
    requests.push({ url, init });
    if (url.endsWith('/upload/v1beta/files')) {
      return jsonResponse({}, { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/session' } });
    }
    if (url.endsWith('/upload/session')) return jsonResponse({ file: { name: 'files/audio-1', uri: 'https://files.example/audio' } });
    if (url.endsWith('/v1beta/interactions')) return jsonResponse({ output_text: '  Gemini transcript  ' });
    if (url.endsWith('/v1beta/files/audio-1')) return jsonResponse({});
    throw new Error(`Unexpected URL: ${url}`);
  });

  const transcript = await provider.transcribe(new Blob(['audio'], { type: 'audio/webm' }));

  assert.equal(transcript, 'Gemini transcript');
  assert.equal(requests.length, 4);
  assert.equal(requests[0].init.headers['X-Goog-Upload-Header-Content-Type'], 'audio/webm');
  assert.equal(requests[1].init.body.size, 5);
  const interaction = JSON.parse(requests[2].init.body);
  assert.equal(interaction.model, 'gemini-3.5-transcribe');
  assert.equal(interaction.store, false);
  assert.deepEqual(interaction.input, [{ type: 'audio', uri: 'https://files.example/audio', mime_type: 'audio/webm' }]);
  assert.equal(requests[3].url, 'https://generativelanguage.googleapis.com/v1beta/files/audio-1');
  assert.equal(requests[3].init.method, 'DELETE');
});

test('Gemini retries file cleanup without rerunning successful transcription', async () => {
  let interactions = 0;
  let deletions = 0;
  const warnings = [];
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url) => {
    if (url.endsWith('/upload/v1beta/files')) {
      return jsonResponse({}, { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/session' } });
    }
    if (url.endsWith('/upload/session')) {
      return jsonResponse({ file: { name: 'files/audio-retry', uri: 'https://files.example/audio-retry' } });
    }
    if (url.endsWith('/v1beta/interactions')) {
      interactions++;
      return jsonResponse({ output_text: 'Transcript survives cleanup retry' });
    }
    if (url.endsWith('/v1beta/files/audio-retry')) {
      deletions++;
      return deletions === 1 ? jsonResponse({ error: 'temporary' }, { status: 503 }) : jsonResponse({});
    }
    throw new Error(`Unexpected URL: ${url}`);
  });

  const transcript = await provider.transcribe(new Blob(['audio'], { type: 'audio/webm' }), warning => warnings.push(warning));

  assert.equal(transcript, 'Transcript survives cleanup retry');
  assert.equal(interactions, 1);
  assert.equal(deletions, 2);
  assert.deepEqual(warnings, []);
});

test('Gemini warns after bounded cleanup failure without rerunning successful transcription', async () => {
  let interactions = 0;
  let deletions = 0;
  const warnings = [];
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url) => {
    if (url.endsWith('/upload/v1beta/files')) {
      return jsonResponse({}, { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/session' } });
    }
    if (url.endsWith('/upload/session')) {
      return jsonResponse({ file: { name: 'files/audio-failure', uri: 'https://files.example/audio-failure' } });
    }
    if (url.endsWith('/v1beta/interactions')) {
      interactions++;
      return jsonResponse({ output_text: 'Transcript survives cleanup failure' });
    }
    if (url.endsWith('/v1beta/files/audio-failure')) {
      deletions++;
      return jsonResponse({ error: 'still unavailable' }, { status: 503 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  });

  const transcript = await provider.transcribe(new Blob(['audio'], { type: 'audio/webm' }), warning => warnings.push(warning));

  assert.equal(transcript, 'Transcript survives cleanup failure');
  assert.equal(interactions, 1);
  assert.equal(deletions, 3);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /could not delete.*files\/audio-failure/i);
});

test('Gemini supports complete and streamed text generation', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url, init) => {
    requests.push({ url, init });
    if (url.includes(':streamGenerateContent')) {
      return sseResponse([
        { candidates: [{ content: { parts: [{ text: 'Streamed ' }] } }] },
        { candidates: [{ content: { parts: [{ text: 'answer' }] } }] },
      ]);
    }
    return jsonResponse({ candidates: [{ content: { parts: [{ text: 'Complete answer' }] } }] });
  });

  assert.equal(await provider.complete({ systemPrompt: 'system', userMessage: 'user', model: 'mini' }), 'Complete answer');
  assert.equal(await provider.stream({ systemPrompt: 'system', userMessage: 'user', model: 'full' }), 'Streamed answer');

  assert.match(requests[0].url, /models\/gemini-3\.5-flash:generateContent$/);
  assert.match(requests[1].url, /models\/gemini-3\.8-flash:streamGenerateContent\?alt=sse$/);
  const body = JSON.parse(requests[0].init.body);
  assert.deepEqual(body.system_instruction, { parts: [{ text: 'system' }] });
  assert.deepEqual(body.contents, [{ role: 'user', parts: [{ text: 'user' }] }]);
});

test('SSE parsing consumes complete event blocks with optional spaces and multiline data', async () => {
  const response = new Response(
    ': keepalive\r\n' +
    'event: message\r\n' +
    'data:{"text":"Hello"}\r\n\r\n' +
    'data: {"text":\n' +
    'data: " world"}\n\n' +
    'data:[DONE]\n\n'
  );

  const text = await readSseText(response, event => event.text ?? '');

  assert.equal(text, 'Hello world');
});
