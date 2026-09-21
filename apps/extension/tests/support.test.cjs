const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '../../..');

test('v0.1.4 exposes only the functional Chromium build and package path', () => {
  const rootPackage = require(path.join(repo, 'package.json'));
  const extensionPackage = require(path.join(repo, 'apps/extension/package.json'));
  const packaging = fs.readFileSync(path.join(repo, 'scripts/package-extension.sh'), 'utf8');
  const readme = fs.readFileSync(path.join(repo, 'README.md'), 'utf8');
  const plan = fs.readFileSync(path.join(repo, 'docs/v0.1.4-plan.md'), 'utf8');

  assert.equal(rootPackage.scripts['build:firefox'], undefined);
  assert.equal(extensionPackage.scripts['build:firefox'], undefined);
  assert.equal(fs.existsSync(path.join(repo, 'apps/extension/vite.firefox.config.ts')), false);
  assert.equal(fs.existsSync(path.join(repo, 'apps/extension/public-firefox')), false);
  assert.doesNotMatch(packaging, /firefox|dist-firefox|decker-firefox/i);
  assert.match(readme, /Chromium browser/i);
  assert.doesNotMatch(readme, /Firefox/i);
  assert.match(plan, /v0\.1\.4 is Chrome-only/i);
});
