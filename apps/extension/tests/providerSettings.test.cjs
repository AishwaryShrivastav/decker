const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  PROVIDER_SETTINGS_STORAGE_KEY,
  clearProviderSettings,
  loadProviderSettings,
  saveProviderSettings,
} = require('../src/shared/providerSettings.ts');

function memoryStorage(initial = {}) {
  const values = { ...initial };
  return {
    values,
    async get() { return { ...values }; },
    async set(patch) { Object.assign(values, patch); },
    async remove(keys) { keys.forEach(key => delete values[key]); },
  };
}

test('legacy OpenAI keys migrate to the versioned provider setting', async () => {
  const storage = memoryStorage({ openaiKey: '  sk-existing  ' });

  const settings = await loadProviderSettings(storage);

  assert.deepEqual(settings, { version: 1, provider: 'openai', apiKey: 'sk-existing' });
  assert.deepEqual(storage.values[PROVIDER_SETTINGS_STORAGE_KEY], settings);
  assert.equal(storage.values.openaiKey, '  sk-existing  ');
});

test('stored provider settings take precedence over the legacy key', async () => {
  const stored = { version: 1, provider: 'gemini', apiKey: 'gemini-key' };
  const storage = memoryStorage({ openaiKey: 'sk-old', [PROVIDER_SETTINGS_STORAGE_KEY]: stored });

  assert.deepEqual(await loadProviderSettings(storage), stored);
});

test('invalid stored settings fall back to a safe empty OpenAI setting', async () => {
  const storage = memoryStorage({
    [PROVIDER_SETTINGS_STORAGE_KEY]: { version: 1, provider: 'claude', apiKey: 'secret' },
  });

  assert.deepEqual(await loadProviderSettings(storage), { version: 1, provider: 'openai', apiKey: '' });
});

test('saving trims provider settings and mirrors OpenAI for old clients', async () => {
  const storage = memoryStorage({ openaiKey: 'sk-old' });

  await saveProviderSettings(storage, { provider: 'openai', apiKey: '  sk-new  ' });

  assert.deepEqual(storage.values[PROVIDER_SETTINGS_STORAGE_KEY], {
    version: 1,
    provider: 'openai',
    apiKey: 'sk-new',
  });
  assert.equal(storage.values.openaiKey, 'sk-new');
});

test('saving Gemini does not overwrite the legacy OpenAI key', async () => {
  const storage = memoryStorage({ openaiKey: 'sk-existing' });

  await saveProviderSettings(storage, { provider: 'gemini', apiKey: '  gemini-key  ' });

  assert.deepEqual(storage.values[PROVIDER_SETTINGS_STORAGE_KEY], {
    version: 1,
    provider: 'gemini',
    apiKey: 'gemini-key',
  });
  assert.equal(storage.values.openaiKey, 'sk-existing');
});

test('saving an empty provider key is rejected without changing storage', async () => {
  const existing = { version: 1, provider: 'openai', apiKey: 'sk-existing' };
  const storage = memoryStorage({ [PROVIDER_SETTINGS_STORAGE_KEY]: existing, openaiKey: 'sk-existing' });

  await assert.rejects(
    saveProviderSettings(storage, { provider: 'openai', apiKey: '' }),
    /API key is required/
  );

  assert.deepEqual(storage.values, {
    [PROVIDER_SETTINGS_STORAGE_KEY]: existing,
    openaiKey: 'sk-existing',
  });
});

test('saving a whitespace-only provider key is rejected without changing storage', async () => {
  const existing = { version: 1, provider: 'gemini', apiKey: 'gemini-existing' };
  const storage = memoryStorage({ [PROVIDER_SETTINGS_STORAGE_KEY]: existing, openaiKey: 'sk-existing' });

  await assert.rejects(
    saveProviderSettings(storage, { provider: 'gemini', apiKey: '   \t\n  ' }),
    /API key is required/
  );

  assert.deepEqual(storage.values, {
    [PROVIDER_SETTINGS_STORAGE_KEY]: existing,
    openaiKey: 'sk-existing',
  });
});

test('clearing provider settings removes both versioned and legacy credentials', async () => {
  const storage = memoryStorage({
    [PROVIDER_SETTINGS_STORAGE_KEY]: { version: 1, provider: 'gemini', apiKey: 'gemini-existing' },
    openaiKey: 'sk-existing',
    unrelated: 'keep-me',
  });

  await clearProviderSettings(storage);

  assert.deepEqual(storage.values, { unrelated: 'keep-me' });
});
