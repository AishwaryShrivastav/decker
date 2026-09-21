const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const extension = path.resolve(__dirname, '..');

test('reopening review restores a compatible edit and ignores one based on an old transcript', () => {
  const { restoredTranscript } = require('../src/review/model.ts');
  assert.deepEqual(restoredTranscript({
    transcript: 'Canonical revision two',
    transcriptRevision: 2,
    edit: { text: 'User edit', baseRevision: 2 },
  }), { text: 'User edit', edited: true });
  assert.deepEqual(restoredTranscript({
    transcript: 'Canonical revision three',
    transcriptRevision: 3,
    edit: { text: 'Old user edit', baseRevision: 2 },
  }), { text: 'Canonical revision three', edited: false });
});

test('review page is a dedicated extension build entry and manifest resource', () => {
  const files = [
    'src/review/Review.tsx',
    'src/review/index.tsx',
    'src/review/review.css',
    'public/src/review/index.html',
  ];
  for (const file of files) assert.equal(fs.existsSync(path.join(extension, file)), true, `${file} should exist`);

  const vite = fs.readFileSync(path.join(extension, 'vite.config.ts'), 'utf8');
  const html = fs.readFileSync(path.join(extension, 'public/src/review/index.html'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'public/manifest.json'), 'utf8'));
  assert.match(vite, /review:\s*resolve\(__dirname,\s*["']src\/review\/index\.tsx["']\)/);
  assert.match(html, /href="\.\/review\.css"/);
  assert.ok(manifest.web_accessible_resources.some(entry => entry.resources.includes('src/review/index.html')));
});

test('review page exposes the full workflow with accessible live state and recovery actions', () => {
  const source = fs.readFileSync(path.join(extension, 'src/review/Review.tsx'), 'utf8');
  assert.match(source, /GET_FULL_STATE/);
  assert.match(source, /SAVE_REVIEW/);
  assert.match(source, /GENERATE_DECK/);
  assert.match(source, /DOWNLOAD_ARTIFACT/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /aria-live/);
  assert.match(source, /role="alert"/);
  assert.match(source, /\.focus\(\)/);
  assert.match(source, /htmlFor=/);
  assert.match(source, /Research status/);
  assert.match(source, /Capture warnings/);
  assert.match(source, /Custom instructions/);
});

test('review layout supports narrow windows and long transcripts', () => {
  const css = fs.readFileSync(path.join(extension, 'src/review/review.css'), 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*700px\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /resize:\s*vertical/);
  assert.match(css, /min-height:\s*[^;]+/);
});
