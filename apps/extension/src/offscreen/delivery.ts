import type { AudioChunkPayload } from '../shared/types';
import { waitForRetry } from '../shared/capture';

// Conversion and acknowledgement are part of the chain, so onstop cannot
// overtake ondataavailable even when FileReader or worker startup is slow.
export class AudioDelivery {
  private chain = Promise.resolve();
  private sequence = 0;
  private missing: number[] = [];
  private finalPayload?: AudioChunkPayload & { missingSequences: number[] };

  constructor(private sessionId: string,
    private send: (type: string, payload: AudioChunkPayload & { missingSequences?: number[] }) => Promise<{ ok?: boolean }>,
    private sleep = waitForRetry) {}

  private async deliver(type: string, payload: AudioChunkPayload): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.send(type, payload);
        if (!response?.ok) throw new Error('Audio was not saved');
        return;
      } catch (error) {
        if (attempt === 2) throw error;
        await this.sleep(1000 * 2 ** attempt);
      }
    }
  }

  enqueue(convert: () => Promise<string>, mimeType: string): void {
    const sequence = this.sequence++;
    this.chain = this.chain.then(async () => {
      try {
        const base64 = await convert();
        if (!base64) throw new Error('Empty audio');
        await this.deliver('AUDIO_CHUNK', { sessionId: this.sessionId, sequence, base64, mimeType });
      } catch {
        this.missing.push(sequence);
      }
    });
  }

  finish(convert: () => Promise<string>, mimeType: string): Promise<void> {
    this.chain = this.chain.then(async () => {
      let base64 = '';
      try { base64 = await convert(); } catch { this.missing.push(this.sequence); }
      this.finalPayload = { sessionId: this.sessionId, sequence: this.sequence++, base64, mimeType, missingSequences: this.missing };
      await this.resendFinal();
    });
    return this.chain;
  }

  async resendFinal(): Promise<boolean> {
    if (!this.finalPayload) return false;
    await this.deliver('RECORDING_STOPPED', this.finalPayload);
    return true;
  }
}
