export function createSilentValidationAudio(): Blob {
  const sampleRate = 16_000;
  const sampleCount = 1_600;
  const bytesPerSample = 2;
  const dataLength = sampleCount * bytesPerSample;
  const bytes = new Uint8Array(44 + dataLength);
  const view = new DataView(bytes.buffer);

  const writeText = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index++) bytes[offset + index] = value.charCodeAt(index);
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataLength, true);

  return new Blob([bytes], { type: "audio/wav" });
}
