const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  savedStateNotice,
  settingsControlsDisabled,
  statusUpdateIsCurrent,
  popupStage,
  providerSetup,
} = require('../src/popup/model.ts');
const { assessCaptureTab, captureErrorMessage } = require('../src/shared/tabReadiness.ts');

test('provider setup copy covers OpenAI and Gemini without sharing key hints', () => {
  assert.deepEqual(providerSetup('openai'), {
    label: 'OpenAI',
    keyLabel: 'OpenAI API key',
    placeholder: 'sk-proj-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpText: 'Create an OpenAI API key',
  });
  assert.deepEqual(providerSetup('gemini'), {
    label: 'Gemini',
    keyLabel: 'Gemini API key',
    placeholder: 'Enter your Gemini API key',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpText: 'Create a Gemini API key',
  });
});

test('supported browser meetings get service names and a general fallback', () => {
  const cases = [
    ['https://meet.google.com/abc-defg-hij', 'Google Meet'],
    ['https://app.zoom.us/wc/123/join', 'Zoom Web'],
    ['https://teams.microsoft.com/v2/', 'Microsoft Teams Web'],
    ['https://example.webex.com/meet/team', 'Webex'],
    ['https://calls.example.org/room', 'Browser meeting'],
  ];
  for (const [url, meetingName] of cases) {
    const result = assessCaptureTab({ id: 7, url, audible: true, mutedInfo: { muted: false } });
    assert.equal(result.eligible, true);
    assert.equal(result.meetingName, meetingName);
    assert.match(result.message, /ready to capture/i);
  }
});

test('muted and silent tabs remain eligible with warnings while unsupported pages are blocked', () => {
  assert.match(assessCaptureTab({ id: 1, active: false, url: 'https://meet.google.com/a', audible: true }).message, /active meeting tab/);
  const muted = assessCaptureTab({ id: 1, url: 'https://meet.google.com/a', audible: true, mutedInfo: { muted: true } });
  assert.equal(muted.eligible, true);
  assert.match(muted.warning, /muted.*capture.*silent/i);
  const silent = assessCaptureTab({ id: 1, url: 'https://meet.google.com/a', audible: false });
  assert.equal(silent.eligible, true);
  assert.match(silent.warning, /No tab audio.*check the captured signal/i);
  assert.match(assessCaptureTab({ id: 1, url: 'chrome://settings', audible: true }).message, /browser does not allow/);
  assert.match(assessCaptureTab({ id: 1, url: 'https://chromewebstore.google.com/detail/example', audible: true }).message, /browser does not allow/);
  assert.match(assessCaptureTab({ id: 1, url: 'chrome-extension://abc/page.html', audible: true }).message, /browser does not allow/);
});

test('popup stages contain setup, readiness, and recording without review or generation', () => {
  assert.equal(popupStage('idle'), 'readiness');
  assert.equal(popupStage('recording'), 'recording');
  assert.equal(popupStage('processing'), 'recording');
  assert.equal(popupStage('reviewing'), 'readiness');
  assert.equal(popupStage('generating'), 'readiness');
  assert.equal(popupStage('done'), 'readiness');
  assert.equal(popupStage('idle', true), 'setup');

  const popupSource = fs.readFileSync(path.resolve(__dirname, '../src/popup/Popup.tsx'), 'utf8');
  assert.doesNotMatch(popupSource, /stage === "complete"|GENERATE_DECK|SAVE_REVIEW|TOPIC_SELECTED|Output format|Topics discovered|recovery data/);
});

test('capture API failures are rewritten as useful next steps', () => {
  const denied = captureErrorMessage('Permission denied');
  assert.match(denied, /permission was denied/i);
  assert.match(denied, /Select the meeting tab.*audio is playing.*reopen Decker.*try again/i);

  const restricted = captureErrorMessage('Cannot access contents of url "chrome:\/\/settings".');
  assert.match(restricted, /browser does not allow/i);
  assert.match(restricted, /regular browser tab.*reopen Decker/i);
  assert.equal(captureErrorMessage(restricted), restricted);

  const failed = captureErrorMessage('Audio device failed');
  assert.match(failed, /Audio capture did not start/i);
  assert.match(failed, /Select the meeting tab.*audio is playing.*reopen Decker.*try again/i);
});

test('completed work stays in readiness with only a concise saved-state notice', () => {
  for (const status of ['reviewing', 'researching', 'generating', 'done']) {
    assert.equal(savedStateNotice(status), 'Recording saved on this device.');
  }
  assert.equal(savedStateNotice('idle'), null);
  assert.equal(savedStateNotice('recording'), null);
  assert.equal(savedStateNotice('error'), null);
});

test('popup accepts only ordered session generations and current revisions', () => {
  assert.equal(statusUpdateIsCurrent('session-new', 4, 3, { sessionId: 'session-old', sessionGeneration: 3, transcriptRevision: 99 }), false);
  assert.equal(statusUpdateIsCurrent('session-new', 4, 3, { sessionId: 'session-other', sessionGeneration: 4, transcriptRevision: 4 }), false);
  assert.equal(statusUpdateIsCurrent('session-new', 4, 3, { sessionId: 'session-new', sessionGeneration: 4, transcriptRevision: 2 }), false);
  assert.equal(statusUpdateIsCurrent('session-new', 4, 3, { sessionId: 'session-new', sessionGeneration: 4, transcriptRevision: 3 }), true);
  assert.equal(statusUpdateIsCurrent('session-new', 4, 3, { sessionId: 'session-next', sessionGeneration: 5, transcriptRevision: 0 }), true);
});

test('provider controls lock during validation and expose selection and focus semantics', () => {
  assert.equal(settingsControlsDisabled('validating'), true);
  assert.equal(settingsControlsDisabled('clearing'), true);
  assert.equal(settingsControlsDisabled('idle'), false);
  assert.equal(settingsControlsDisabled('saved'), false);

  const popupSource = fs.readFileSync(path.resolve(__dirname, '../src/popup/Popup.tsx'), 'utf8');
  assert.match(popupSource, /aria-pressed=\{provider === option\}/);
  assert.match(popupSource, /disabled=\{settingsPending\}/);
  assert.match(popupSource, /keyInputRef\.current\?\.focus\(\)/);
});
