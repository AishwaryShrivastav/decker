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

test('OpenAI validates keys and reports provider errors without exposing the key', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'openai', apiKey: 'sk-private' }, async (url, init) => {
    requests.push({ url, init });
    return jsonResponse({ error: { message: 'Incorrect API key' } }, { status: 401 });
  });

  await assert.rejects(provider.validateKey(), err => {
    assert.match(err.message, /OpenAI key validation failed.*Incorrect API key/);
    assert.doesNotMatch(err.message, /sk-private/);
    return true;
  });
  assert.equal(requests[0].url, 'https://api.openai.com/v1/models');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer sk-private');
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

test('Gemini validates with the models API', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url, init) => {
    requests.push({ url, init });
    return jsonResponse({ models: [] });
  });

  await provider.validateKey();

  assert.equal(requests[0].url, 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1');
  assert.equal(requests[0].init.headers['x-goog-api-key'], 'gemini-key');
});

test('Gemini uploads audio and uses the transcription interaction', async () => {
  const requests = [];
  const provider = createProviderAdapter({ provider: 'gemini', apiKey: 'gemini-key' }, async (url, init) => {
    requests.push({ url, init });
    if (url.endsWith('/upload/v1beta/files')) {
      return jsonResponse({}, { headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/session' } });
    }
    if (url.endsWith('/upload/session')) return jsonResponse({ file: { uri: 'https://files.example/audio' } });
    return jsonResponse({ output_text: '  Gemini transcript  ' });
  });

  const transcript = await provider.transcribe(new Blob(['audio'], { type: 'audio/webm' }));

  assert.equal(transcript, 'Gemini transcript');
  assert.equal(requests.length, 3);
  assert.equal(requests[0].init.headers['X-Goog-Upload-Header-Content-Type'], 'audio/webm');
  assert.equal(requests[1].init.body.size, 5);
  const interaction = JSON.parse(requests[2].init.body);
  assert.equal(interaction.model, 'gemini-3.5-transcribe');
  assert.deepEqual(interaction.input, [{ type: 'audio', uri: 'https://files.example/audio', mime_type: 'audio/webm' }]);
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
