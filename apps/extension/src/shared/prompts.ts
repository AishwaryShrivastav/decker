/**
 * Single source of truth for all LLM prompts used by Decker.
 *
 * System prompts define role + output format (stable).
 * User message builders include the transcript, selected points, and custom instructions (variable).
 * Keeping custom instructions in the user message ensures GPT-4o follows them even with json_object mode.
 */

// ---------------------------------------------------------------------------
// Extract discussion points
// ---------------------------------------------------------------------------

export const EXTRACT_POINTS_SYSTEM =
  `You are an expert meeting analyst. Given a meeting transcript, extract the 5–12 most important discussion points, decisions, or topics covered. Each point should be a concise phrase (under 15 words). Return ONLY a JSON object with a single key "points" whose value is an array of strings. Example: {"points": ["Q3 roadmap priorities", "Hiring two engineers"]}`;

export function extractPointsUser(transcript: string): string {
  return `Extract the key discussion points from this transcript. Return a JSON object with a "points" array.\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Generate Reveal.js presentation
// ---------------------------------------------------------------------------

export const DECK_SYSTEM =
  `You are an expert at distilling meeting transcripts into clear, concise Reveal.js presentations with optional infographics.

Return ONLY valid JSON with this exact structure (no extra fields, no markdown fences):
{"title":"string","subtitle":"optional string","slides":[{"title":"string","bullets":["string"],"notes":"optional string","chart":optional,"mermaid":optional}]}

Output rules:
- "title": short deck title (≤6 words)
- "subtitle": optional date or meeting name
- "slides": 3–12 slides. Each has:
  - "title": ≤8 words
  - "bullets": 3–5 concise strings
  - "notes": optional speaker notes
  - "chart": only when numeric data exists. Format: {"type":"pie"|"bar"|"line"|"doughnut","title":"optional","labels":["A","B"],"values":[40,60]}
  - "mermaid": only for process/timeline/flow. Example: "flowchart LR\\n  A[Start] --> B[Review] --> C[Approve]"
- Add chart or mermaid to at most 1–2 slides. Omit if not clearly supported by the transcript.
- Do NOT include a title slide — it is added automatically.
- Last slide must be "Action Items" or "Next Steps".`;

export function deckUser(transcript: string, points: string[], customPrompt: string): string {
  const pointsSection = points.length > 0
    ? `\n\nFocus specifically on these discussion points:\n${points.map((p) => `- ${p}`).join("\n")}`
    : "";
  const customSection = customPrompt.trim()
    ? `\n\nIMPORTANT — follow these additional instructions exactly:\n${customPrompt.trim()}`
    : "";
  return `Create a presentation deck from this meeting transcript. Return a JSON object only.${pointsSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Generate HTML notes
// ---------------------------------------------------------------------------

export const NOTES_SYSTEM =
  `You are an expert at distilling meeting transcripts into clear, well-structured meeting notes with optional infographics.

Return ONLY valid JSON with this exact structure (no extra fields, no markdown fences):
{"title":"string","subtitle":"optional string","sections":[{"heading":"string","items":["string"],"chart":optional,"mermaid":optional}]}

Output rules:
- "title": concise meeting title
- "subtitle": optional date or meeting name
- "sections": 3–6 sections. Each has:
  - "heading": section title
  - "items": 3–8 bullet strings
  - "chart": only when numeric data exists. Format: {"type":"pie"|"bar"|"line"|"doughnut","title":"optional","labels":["A","B"],"values":[40,60]}
  - "mermaid": only for process/timeline/flow. Example: "flowchart LR\\n  A[Start] --> B[Review] --> C[Approve]"
- Add chart or mermaid to at most 1–2 sections. Omit if not clearly supported by the transcript.
- Last section must be "Action Items" or "Next Steps".`;

export function notesUser(transcript: string, points: string[], customPrompt: string): string {
  const pointsSection = points.length > 0
    ? `\n\nFocus specifically on these discussion points:\n${points.map((p) => `- ${p}`).join("\n")}`
    : "";
  const customSection = customPrompt.trim()
    ? `\n\nIMPORTANT — follow these additional instructions exactly:\n${customPrompt.trim()}`
    : "";
  return `Create meeting notes from this transcript. Return a JSON object only.${pointsSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}
