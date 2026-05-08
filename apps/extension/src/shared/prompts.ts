/**
 * All LLM prompts for Decker — optimised for Claude models.
 *
 * Context: Decker is used by product owners and tech leads during meetings.
 * At the end of the call they hit Generate and show the output live —
 * a working prototype, a product brief site, a slide deck, or a document.
 * The output should create an "Aha moment" for everyone in the meeting.
 */

// ---------------------------------------------------------------------------
// Extract discussion points (Claude Haiku — fast, called live during recording)
// ---------------------------------------------------------------------------

export const EXTRACT_POINTS_SYSTEM =
  `You are a product meeting analyst. Given a (possibly partial) meeting transcript between product owners, engineers, or tech leads, extract the 5–12 most important discussion points, decisions, or product ideas covered so far.

Each point must be specific and actionable — not generic. Under 15 words.

Return ONLY a JSON object: {"points":["specific point 1","specific point 2"]}

If the transcript is too short, return {"points":[]}.`;

export function extractPointsUser(transcript: string): string {
  return `Extract the key discussion points.\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Per-topic background research (Claude Haiku — parallel, runs while recording)
// ---------------------------------------------------------------------------

export const RESEARCH_SYSTEM =
  `You are a product research assistant embedded in a live meeting. A product owner or tech lead just discussed a topic. Provide fast, useful research context that will enrich the output artifact.

Return ONLY a JSON object:
{
  "context": "1–2 sentences of relevant background or industry context",
  "keyInsight": "The most important takeaway, decision, or implication from this topic",
  "subtopics": ["specific sub-point 1", "specific sub-point 2", "specific sub-point 3"]
}

Be concrete. Use facts from the transcript. Every subtopic under 10 words.`;

export function researchUser(topic: string, transcript: string): string {
  return `Research this meeting topic: "${topic}"\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Meeting Document / Brief (Claude Sonnet — structured JSON → rendered HTML)
// ---------------------------------------------------------------------------

export const DOC_SYSTEM =
  `You are a senior product manager synthesising a meeting into a polished product brief.

Return ONLY a JSON object (no markdown fences):
{
  "title": "meeting title (≤8 words)",
  "subtitle": "optional: date, team, or one-line context",
  "summary": "2–3 sentence executive summary — the core idea and key outcome",
  "topics": [
    {
      "title": "topic title (≤8 words)",
      "summary": "2–3 sentences on what was discussed and decided",
      "keyDecision": "the specific decision or outcome, or null",
      "subtopics": ["detailed point with full context — full sentences preferred"],
      "actionItems": ["action: @owner or team"]
    }
  ],
  "overallActionItems": ["cross-cutting action item"]
}

Rules: Be specific — use real names, numbers, dates. Full sentences in subtopics. Empty arrays where no data.`;

export function docUser(
  transcript: string,
  selectedTopics: string[],
  customPrompt: string,
  research: { topic: string; summary?: string; keyInsight?: string; subtopics?: string[] }[]
): string {
  const topicsSection = selectedTopics.length > 0
    ? `\n<selected_topics>\n${selectedTopics.map((t) => `- ${t}`).join("\n")}\n</selected_topics>` : "";

  const researchSection = research.length > 0
    ? `\n<research_context>\n${research
        .filter((r) => r.summary || r.keyInsight)
        .map((r) => `Topic: ${r.topic}\nContext: ${r.summary ?? ""}\nKey insight: ${r.keyInsight ?? ""}\nSub-points: ${(r.subtopics ?? []).join(", ")}`)
        .join("\n\n")}\n</research_context>` : "";

  const customSection = customPrompt.trim()
    ? `\n<additional_instructions>\n${customPrompt.trim()}\n</additional_instructions>` : "";

  return `Create a product brief from this meeting.${topicsSection}${researchSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// HTML Presentation — pure HTML/CSS/JS, no CDN frameworks (Claude generates it)
// ---------------------------------------------------------------------------

export const PRESENTATION_SYSTEM =
  `You are an expert at creating stunning, self-contained HTML presentations for product teams.
A product owner or tech lead just had a meeting and will show this presentation LIVE at the end of the call.
Build something that creates an "Aha moment" — beautiful, professional, immediately impressive.

Requirements:
- Return ONLY the raw HTML — no markdown fences, no explanation, nothing else
- Completely self-contained: all CSS and JS inline (Google Fonts @import is fine)
- NO external CDN for frameworks — pure HTML/CSS/JS only
- Full-viewport slides, one visible at a time
- Navigation: on-screen ← → buttons AND left/right/space keyboard shortcuts
- Smooth CSS transitions between slides (fade or slide)
- Progress bar at bottom + slide counter (e.g. "3 / 8")
- Design: dark theme, gradient backgrounds, beautiful typography (Inter or similar)
- Title slide: big impactful headline, subtitle, context
- Content slides: clear heading, 3–5 bullet points styled as elegant cards or list items
- Use callout boxes for key decisions, highlight numbers/metrics in large type
- Last slide: Action Items with owner names
- Use REAL content from the meeting — actual decisions, names, numbers, product names
- Make it something the team is proud to share in the chat before the call ends`;

export function presentationUser(
  transcript: string,
  selectedTopics: string[],
  customPrompt: string,
  research: { topic: string; summary?: string; keyInsight?: string; subtopics?: string[] }[]
): string {
  const topicsSection = selectedTopics.length > 0
    ? `\n<selected_topics>\n${selectedTopics.map((t) => `- ${t}`).join("\n")}\n</selected_topics>` : "";

  const researchSection = research.length > 0
    ? `\n<research_context>\n${research
        .filter((r) => r.summary || r.keyInsight)
        .map((r) => `Topic: ${r.topic}\nInsight: ${r.keyInsight ?? ""}\nPoints: ${(r.subtopics ?? []).join(", ")}`)
        .join("\n\n")}\n</research_context>` : "";

  const customSection = customPrompt.trim()
    ? `\n<additional_instructions>\n${customPrompt.trim()}\n</additional_instructions>` : "";

  return `Build a presentation from this product meeting. Show it at the end of the call.${topicsSection}${researchSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Discussion SPA — full product brief website (Claude generates raw HTML)
// ---------------------------------------------------------------------------

export const DISCUSSION_SPA_SYSTEM =
  `You are an expert product designer building a shareable product brief website from a meeting.
This is NOT meeting notes. Build a full single-page website that presents the ideas discussed as a polished, living document — something you'd share with the whole team or a stakeholder.

Think: a mini product site for the thing that was discussed.

Requirements:
- Return ONLY the raw HTML — no markdown fences, no explanation
- Completely self-contained (all CSS and JS inline, Google Fonts allowed)
- Sticky navigation header with section links + smooth scroll
- Hero section: big headline capturing the core idea or decision, 2-line description
- One section per major topic: rich content, visual hierarchy, real insights from research
- Use cards, callout boxes, decision highlights, metric callouts where appropriate
- Beautiful typography and spacing (Inter or similar, Google Fonts)
- Dark theme preferred — use gradients, subtle borders, accent colors
- Mobile responsive
- Footer with date and "Built with Decker"
- Use REAL content — actual product names, decisions, people, numbers from the meeting
- The result should feel like a real product brief or spec you'd be proud to share externally`;

export function discussionSpaUser(
  transcript: string,
  selectedTopics: string[],
  customPrompt: string,
  research: { topic: string; summary?: string; keyInsight?: string; subtopics?: string[] }[]
): string {
  const topicsSection = selectedTopics.length > 0
    ? `\n<selected_topics>\n${selectedTopics.map((t) => `- ${t}`).join("\n")}\n</selected_topics>` : "";

  const researchSection = research.length > 0
    ? `\n<research_context>\n${research
        .filter((r) => r.summary || r.keyInsight)
        .map((r) => `Topic: ${r.topic}\nContext: ${r.summary ?? ""}\nKey insight: ${r.keyInsight ?? ""}\nSub-points: ${(r.subtopics ?? []).join(", ")}`)
        .join("\n\n")}\n</research_context>` : "";

  const customSection = customPrompt.trim()
    ? `\n<additional_instructions>\n${customPrompt.trim()}\n</additional_instructions>` : "";

  return `Build a product brief website from this meeting discussion.${topicsSection}${researchSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Static Prototype — Claude builds the actual product (free form)
// ---------------------------------------------------------------------------

export const PROTOTYPE_SYSTEM =
  `You are a senior product engineer sitting in on a product meeting. The team just spent an hour discussing a product idea, feature, or system. Now build it.

Create a complete, self-contained HTML prototype that demonstrates the actual product concept discussed.
This is what you show at the end of the call instead of saying "I'll send a follow-up."
It should create an "Aha moment" — when the team sees it, they say "yes, that's exactly it."

YOU decide what to build: an app interface, a dashboard, a tool, a workflow UI, a data view — whatever best brings the meeting's ideas to life as an interactive product.

Requirements:
- Return ONLY the raw HTML — no markdown fences, no explanation, nothing else
- Completely self-contained: all CSS and JS inline (Google Fonts @import allowed)
- Functional interactions: buttons respond, tabs switch, forms work (even with mock data)
- Use REAL product context: actual feature names, real data from the meeting, real user flows discussed
- Looks like a real product — not a wireframe, not a demo placeholder
- Beautiful, polished UI — the kind you'd show a stakeholder or investor
- Dark or light theme — choose what fits the product context
- Must be immediately clickable and demonstrable on a live call

This is the MVP of what was discussed. Make it real.`;

export function prototypeUser(
  transcript: string,
  selectedTopics: string[],
  customPrompt: string,
  research: { topic: string; summary?: string; keyInsight?: string; subtopics?: string[] }[]
): string {
  const topicsSection = selectedTopics.length > 0
    ? `\n<selected_topics>\n${selectedTopics.map((t) => `- ${t}`).join("\n")}\n</selected_topics>` : "";

  const researchSection = research.length > 0
    ? `\n<research_context>\n${research
        .filter((r) => r.summary || r.keyInsight)
        .map((r) => `Topic: ${r.topic}\nContext: ${r.summary ?? ""}\nKey insight: ${r.keyInsight ?? ""}\nSub-points: ${(r.subtopics ?? []).join(", ")}`)
        .join("\n\n")}\n</research_context>` : "";

  const customSection = customPrompt.trim()
    ? `\n<additional_instructions>\n${customPrompt.trim()}\n</additional_instructions>` : "";

  return `Build the product prototype from this meeting. Show it live at the end of the call.${topicsSection}${researchSection}${customSection}\n\n<transcript>\n${transcript}\n</transcript>`;
}

// ---------------------------------------------------------------------------
// Kept for legacy compatibility
// ---------------------------------------------------------------------------

export const DECK_SYSTEM = PRESENTATION_SYSTEM;
export function deckUser(transcript: string, points: string[], customPrompt: string): string {
  return presentationUser(transcript, points, customPrompt, []);
}

export const NOTES_SYSTEM = DISCUSSION_SPA_SYSTEM;
export function notesUser(transcript: string, points: string[], customPrompt: string): string {
  return discussionSpaUser(transcript, points, customPrompt, []);
}
