import type { FullStateResponse } from "../shared/types";

export interface RestoredTranscript {
  text: string;
  edited: boolean;
}

export function restoredTranscript(
  state: Pick<FullStateResponse, "transcript" | "transcriptRevision" | "edit">
): RestoredTranscript {
  if (state.edit?.baseRevision === state.transcriptRevision) {
    return { text: state.edit.text, edited: true };
  }
  return { text: state.transcript ?? "", edited: false };
}
