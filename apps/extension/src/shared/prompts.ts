/**
 * All LLM prompts for Decker — optimised for Claude models.
 *
 * Claude works best with clear XML-tagged inputs, explicit JSON schemas,
 * and separate system / user messages (no json_object mode needed).
 */

// ---------------------------------------------------------------------------
// Extract discussion points (Claude Haiku — fast, called every few chunks)
// ---------------------------------------------------------------------------

export const EXTRACT_POINTS_SYSTEM =
  `You are an expert meeting analyst. Given a (possibly partial) meeting transcript, extract the 5–12 most important discussion points, decisions, or topics covered so far.

Each point must be a concise phrase under 15 words. Be specific, not generic.

Return ONLY a JSON object with a single "points" array. Example:
{"points":["Q3 mobile rewrite decision","Hiring two senior engineers by August","Budget cut 20% for Q4"]}

If the transcript is too short to extract meaningful points, return {"points":[]}.`;

export function extractPointsUser(transcript: string): string {
  return `Extract the key discussion points from this transcript.\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Per-topic research (Claude Haiku — called in parallel for each topic)
// ---------------------------------------------------------------------------

export const RESEARCH_SYSTEM =
  `You are a research assistant helping enrich a meeting document. Given a discussion topic and the meeting transcript, provide a brief, insightful research summary.

Return ONLY a JSON object with this exact structure:
{
  "context": "1–2 sentences of background or broader context for this topic",
  "keyInsight": "The single most important takeaway, decision, or finding from the meeting on this topic",
  "subtopics": ["specific sub-point 1", "specific sub-point 2", "specific sub-point 3"]
}

Be specific and concrete. Draw from the transcript. Each subtopic should be a brief phrase under 10 words.`;

export function researchUser(topic: string, transcript: string): string {
  return `Research this meeting topic: "${topic}"\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Generate meeting document (Claude Sonnet — final generation)
// ---------------------------------------------------------------------------

export const DOC_SYSTEM =
  `You are an expert at synthesising meeting transcripts into clear, detailed meeting documents.

Given a transcript and selected topics (with optional research context), produce a structured meeting document.

Return ONLY a JSON object with this exact structure (no markdown fences):
{
  "title": "concise meeting title (≤8 words)",
  "subtitle": "optional: date, team name, or context",
  "summary": "2–3 sentence executive summary of the whole meeting",
  "topics": [
    {
      "title": "topic title (≤8 words)",
      "summary": "2–3 sentences describing what was discussed and decided on this topic",
      "keyDecision": "The key decision or outcome, or null if none",
      "subtopics": ["detailed sub-point with context", "another sub-point"],
      "actionItems": ["action: owner or 'team'"]
    }
  ],
  "overallActionItems": ["action item not tied to a specific topic"]
}

Rules:
- Each topic.subtopics: 3–6 specific, actionable points. Full sentences preferred.
- Each topic.actionItems: concrete next steps from the meeting, if any.
- overallActionItems: broader actions that span multiple topics.
- Be specific — use names, numbers, dates if mentioned in transcript.
- If no action items exist, use empty arrays.`;

export function docUser(
  transcript: string,
  selectedTopics: string[],
  customPrompt: string,
  research: { topic: string; summary?: string; keyInsight?: string; subtopics?: string[] }[]
): string {
  const topicsSection =
    selectedTopics.length > 0
      ? `\n<selected_topics>\n${selectedTopics.map((t) => `- ${t}`).join("\n")}\n</selected_topics>`
      : "";

  const researchSection =
    research.length > 0
      ? `\n<research_context>\n${research
          .filter((r) => r.summary || r.keyInsight)
          .map(
            (r) =>
              `Topic: ${r.topic}\nContext: ${r.summary ?? ""}\nKey insight: ${r.keyInsight ?? ""}\nSub-points: ${(r.subtopics ?? []).join(", ")}`
          )
          .join("\n\n")}\n</research_context>`
      : "";

  const customSection = customPrompt.trim()
    ? `\n<additional_instructions>\n${customPrompt.trim()}\n</additional_instructions>`
    : "";

  return `Create a detailed meeting document from this transcript. Focus on the selected topics and incorporate the research context.${topicsSection}${researchSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Reveal.js presentation prompts (kept for compatibility)
// ---------------------------------------------------------------------------

export const DECK_SYSTEM =
  `You are an expert at distilling meeting transcripts into concise Reveal.js presentations.

Return ONLY valid JSON (no markdown fences):
{"title":"string","subtitle":"optional string","slides":[{"title":"string","bullets":["string"],"notes":"optional string","chart":optional,"mermaid":optional}]}

Rules:
- "title": short deck title (≤6 words)
- "subtitle": optional date or meeting name
- "slides": 3–12 slides. Each:
  - "title": ≤8 words
  - "bullets": 3–5 concise strings
  - "notes": optional speaker notes (what to say aloud)
  - "chart": only when numeric data exists. {"type":"pie"|"bar"|"line"|"doughnut","title":"optional","labels":["A","B"],"values":[40,60]}
  - "mermaid": only for process/flow. "flowchart LR\\n  A[Start] --> B[End]"
- At most 1–2 slides with chart or mermaid.
- No title slide — added automatically.
- Last slide: "Action Items" or "Next Steps".`;

export function deckUser(transcript: string, points: string[], customPrompt: string): string {
  const pointsSection =
    points.length > 0
      ? `\n\nFocus on these discussion points:\n${points.map((p) => `- ${p}`).join("\n")}`
      : "";
  const customSection = customPrompt.trim()
    ? `\n\nAdditional instructions: ${customPrompt.trim()}`
    : "";
  return `Create a presentation deck from this meeting transcript. Return JSON only.${pointsSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Notes prompts (kept for compatibility)
// ---------------------------------------------------------------------------

export const NOTES_SYSTEM =
  `You are an expert at distilling meeting transcripts into clear, well-structured meeting notes.

Return ONLY valid JSON (no markdown fences):
{"title":"string","subtitle":"optional string","sections":[{"heading":"string","items":["string"],"chart":optional,"mermaid":optional}]}

Rules:
- "title": concise meeting title
- "subtitle": optional
- "sections": 3–6 sections. Each:
  - "heading": section title
  - "items": 3–8 bullet strings
  - "chart": optional, same format as deck
  - "mermaid": optional
- At most 1–2 sections with chart or mermaid.
- Last section: "Action Items" or "Next Steps".`;

export function notesUser(transcript: string, points: string[], customPrompt: string): string {
  const pointsSection =
    points.length > 0
      ? `\n\nFocus on these discussion points:\n${points.map((p) => `- ${p}`).join("\n")}`
      : "";
  const customSection = customPrompt.trim()
    ? `\n\nAdditional instructions: ${customPrompt.trim()}`
    : "";
  return `Create meeting notes from this transcript. Return JSON only.${pointsSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}
