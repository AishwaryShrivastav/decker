import { Message, MessageType, OffscreenStartPayload } from '../shared/types';
import { AudioDelivery } from './delivery';

const SEGMENT_MS = 16_000;
let mediaRecorder: MediaRecorder | null = null;
let audioContext: AudioContext | null = null;
let tabStream: MediaStream | null = null;
let micStream: MediaStream | null = null;
let segmentTimer: ReturnType<typeof setTimeout> | undefined;
let silenceTimer: ReturnType<typeof setTimeout> | undefined;
let sessionId = '';
let stopping = false;
let finishing = false;
let delivery: AudioDelivery | null = null;

function warn(warning: string): void {
  chrome.runtime.sendMessage({ type: MessageType.CAPTURE_WARNING, payload: { sessionId, warning } }).catch(() => {});
}

async function releaseSources(): Promise<void> {
  clearTimeout(segmentTimer);
  clearTimeout(silenceTimer);
  tabStream?.getTracks().forEach(t => t.stop());
  micStream?.getTracks().forEach(t => t.stop());
  tabStream = null;
  micStream = null;
  const context = audioContext;
  audioContext = null;
  if (context && context.state !== 'closed') await context.close();
}

async function startRecording(payload: OffscreenStartPayload): Promise<string[]> {
  if (mediaRecorder?.state === 'recording' || finishing) throw new Error('Audio capture is already active.');
  sessionId = payload.sessionId;
  stopping = false;
  const warnings: string[] = [];
  try {
    tabStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-expect-error Chrome tab-capture constraints
        mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: payload.streamId },
      }, video: false,
    });
    if (!tabStream.getAudioTracks().some(t => t.readyState === 'live')) {
      throw new Error('No tab audio track was captured. Reopen the Meet tab and try again.');
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!micStream.getAudioTracks().some(t => t.readyState === 'live')) throw new Error('No live microphone');
    } catch {
      micStream?.getTracks().forEach(t => t.stop());
      micStream = null;
      warnings.push('Microphone unavailable. Only tab audio is being captured; your voice may be missing. Allow microphone access in Settings.');
    }
    if (tabStream.getAudioTracks().some(t => t.muted)) warnings.push('The tab audio track is muted. Check that meeting audio is playing.');

    audioContext = new AudioContext();
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    const destination = audioContext.createMediaStreamDestination();
    tabSource.connect(destination);
    tabSource.connect(audioContext.destination);
    if (micStream) audioContext.createMediaStreamSource(micStream).connect(destination);
    if (audioContext.state === 'suspended') await audioContext.resume();
    if (audioContext.state !== 'running') throw new Error('Audio processing did not start. Try starting capture again.');

    for (const track of tabStream.getAudioTracks()) track.onended = () => {
      warn('Tab audio ended. Capture stopped; the end of the meeting may be missing.');
      stopRecording();
    };
    for (const track of micStream?.getAudioTracks() ?? []) track.onended = () => {
      if (!stopping) warn('The microphone disconnected during capture. Your voice may be missing after disconnection.');
    };

    // A live track does not guarantee a signal. Check once without blocking start.
    const analyser = audioContext.createAnalyser();
    audioContext.createMediaStreamSource(destination.stream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let heardAudio = false;
    let checks = 0;
    const checkSignal = () => {
      if (stopping) return;
      analyser.getByteTimeDomainData(samples);
      heardAudio ||= samples.some(value => Math.abs(value - 128) > 2);
      if (++checks < 20) silenceTimer = setTimeout(checkSignal, 500);
      else if (!heardAudio) warn('No audio signal was detected during the first 10 seconds. Check meeting sound and microphone access; the transcript may be incomplete.');
    };
    silenceTimer = setTimeout(checkSignal, 500);

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      .find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error('This browser has no supported audio recording format.');
    delivery = new AudioDelivery(sessionId, (type, data) => chrome.runtime.sendMessage({ type, payload: data }));
    const mixedStream = destination.stream;
    const recordSegment = () => {
      const parts: Blob[] = [];
      const recorder = new MediaRecorder(mixedStream, { mimeType, audioBitsPerSecond: 128_000 });
      mediaRecorder = recorder;
      recorder.ondataavailable = event => { if (event.data.size > 0) parts.push(event.data); };
      recorder.onerror = () => {
        warn('The audio recorder failed. Some audio may be missing.');
        stopRecording();
      };
      recorder.onstop = () => {
        clearTimeout(segmentTimer);
        const blob = new Blob(parts, { type: mimeType });
        // Each recorder produces its own container header. Reusing the first
        // chunk would replay its speech and produce malformed later segments.
        if (!stopping) {
          delivery!.enqueue(() => blobToBase64(blob), mimeType);
          recordSegment();
        } else {
          finishing = true;
          void releaseSources();
          void delivery!.finish(() => blob.size ? blobToBase64(blob) : Promise.resolve(''), mimeType)
            .then(() => { finishing = false; })
            .catch(() => warn('Final audio delivery was interrupted. Reopen Decker to recover the final segment.'));
        }
      };
      recorder.start();
      segmentTimer = setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, SEGMENT_MS);
    };
    recordSegment();
    return warnings;
  } catch (error) {
    stopping = true;
    await releaseSources();
    throw error;
  }
}

function stopRecording(): void {
  stopping = true;
  clearTimeout(segmentTimer);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  // If a rotation already queued onstop, its handler observes stopping and
  // sends that segment as the tail instead of creating another recorder.
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  switch (message.type) {
    case MessageType.OFFSCREEN_START:
      startRecording(message.payload as OffscreenStartPayload).then(
        warnings => sendResponse({ ok: true, warnings }),
        error => sendResponse({ error: error instanceof Error ? error.message : String(error) }),
      );
      return true;
    case MessageType.OFFSCREEN_STOP:
      stopRecording(); sendResponse({ ok: true }); return false;
    case MessageType.OFFSCREEN_STATUS:
      sendResponse({ sessionId, active: !stopping && mediaRecorder?.state === 'recording', finishing });
      if (finishing) void delivery?.resendFinal().then(sent => { if (sent) finishing = false; }).catch(() => {});
      return false;
    default: return false;
  }
});
