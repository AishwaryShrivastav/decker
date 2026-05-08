import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildRevealHtml, DeckData } from "./revealTemplate";
import { buildNotesHtml, NotesData } from "./notesTemplate";

export const runtime = "edge";
export const maxDuration = 120;

export type OutputFormat = "doc" | "presentation" | "notes";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function validChart(
  chart: unknown
): { type: "bar" | "pie" | "line" | "doughnut"; title?: string; labels: string[]; values: number[] } | undefined {
  if (!chart || typeof chart !== "object") return undefined;
  const c = chart as Record<string, unknown>;
  if (!Array.isArray(c.labels) || !Array.isArray(c.values)) return undefined;
  if (c.labels.length !== c.values.length || c.labels.length === 0) return undefined;
  const type = (["bar", "pie", "line", "doughnut"].includes(String(c.type)) ? c.type : "bar") as
    | "bar"
    | "pie"
    | "line"
    | "doughnut";
  return {
    type,
    title: typeof c.title === "string" ? c.title : undefined,
    labels: (c.labels as unknown[]).filter((l): l is string => typeof l === "string").slice(0, 12),
    values: (c.values as unknown[])
      .filter((v): v is number => typeof v === "number" && !isNaN(v))
      .slice(0, 12),
  };
}

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get("X-Api-Key") ?? process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key. Add your Anthropic key in Decker settings." },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const body = (await req.json()) as {
    transcript?: string;
    selectedPoints?: string[];
    customPrompt?: string;
    backgroundColor?: string;
    outputFormat?: OutputFormat;
    researchContext?: { topic: string; summary?: string; keyInsight?: string; subtopics?: string[] }[];
  };

  if (!body.transcript || typeof body.transcript !== "string") {
    return NextResponse.json({ error: "Missing transcript" }, { status: 400, headers: CORS_HEADERS });
  }

  const transcript = body.transcript.trim();
  if (transcript.length < 50) {
    return NextResponse.json(
      { error: "Transcript is too short to generate a meaningful document" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const selectedPoints = Array.isArray(body.selectedPoints) ? body.selectedPoints : [];
  const customPrompt = typeof body.customPrompt === "string" ? body.customPrompt : "";
  const outputFormat: OutputFormat = body.outputFormat ?? "doc";
  const researchContext = Array.isArray(body.researchContext) ? body.researchContext : [];

  const isAnthropic = apiKey.startsWith("sk-ant-");
  const client = isAnthropic
    ? new Anthropic({ apiKey })
    : new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? apiKey,
      });

  try {
    let systemPrompt: string;
    let userMessage: string;

    if (outputFormat === "presentation") {
      const pointsClause =
        selectedPoints.length > 0
          ? `\n\nFocus on these discussion points:\n${selectedPoints.map((p) => `- ${p}`).join("\n")}`
          : "";
      const customClause = customPrompt ? `\n\nAdditional instructions: ${customPrompt}` : "";

      systemPrompt = `You are an expert at distilling meeting transcripts into clear, concise Reveal.js presentations.

Return ONLY valid JSON (no markdown fences):
{"title":"string","subtitle":"optional string","slides":[{"title":"string","bullets":["string"],"notes":"optional string","chart":optional,"mermaid":optional}]}

Rules:
- "title": short deck title (≤6 words)
- "subtitle": optional
- "slides": 3–12 slides. Each: "title" (≤8 words), "bullets" (3–5), optional "notes", "chart", "mermaid"
- chart: {"type":"pie"|"bar"|"line"|"doughnut","title":"optional","labels":["A"],"values":[1]}
- mermaid: "flowchart LR\\n  A --> B"
- At most 1–2 slides with chart/mermaid
- No title slide (added automatically)
- Last slide: "Action Items" or "Next Steps"${pointsClause}${customClause}`;

      userMessage = `Create a presentation from this transcript. Return JSON only.\n\n<transcript>\n${transcript}\n</transcript>`;
    } else if (outputFormat === "notes") {
      const pointsClause =
        selectedPoints.length > 0
          ? `\n\nFocus on these discussion points:\n${selectedPoints.map((p) => `- ${p}`).join("\n")}`
          : "";
      const customClause = customPrompt ? `\n\nAdditional instructions: ${customPrompt}` : "";

      systemPrompt = `You are an expert at distilling meeting transcripts into clear, structured meeting notes.

Return ONLY valid JSON (no markdown fences):
{"title":"string","subtitle":"optional string","sections":[{"heading":"string","items":["string"],"chart":optional,"mermaid":optional}]}

Rules:
- "sections": 3–6 sections, each with "heading" and "items" (3–8 bullets)
- chart/mermaid: optional, at most 1–2 sections
- Last section: "Action Items"${pointsClause}${customClause}`;

      userMessage = `Create meeting notes from this transcript. Return JSON only.\n\n<transcript>\n${transcript}\n</transcript>`;
    } else {
      // Meeting document (default)
      const topicsSection =
        selectedPoints.length > 0
          ? `\n<selected_topics>\n${selectedPoints.map((t) => `- ${t}`).join("\n")}\n</selected_topics>`
          : "";

      const researchSection =
        researchContext.length > 0
          ? `\n<research_context>\n${researchContext
              .filter((r) => r.summary || r.keyInsight)
              .map(
                (r) =>
                  `Topic: ${r.topic}\nContext: ${r.summary ?? ""}\nKey insight: ${r.keyInsight ?? ""}\nSub-points: ${(r.subtopics ?? []).join(", ")}`
              )
              .join("\n\n")}\n</research_context>`
          : "";

      const customClause = customPrompt
        ? `\n<additional_instructions>\n${customPrompt}\n</additional_instructions>`
        : "";

      systemPrompt = `You are an expert at synthesising meeting transcripts into clear, detailed meeting documents.

Return ONLY a JSON object (no markdown fences):
{
  "title": "concise meeting title (≤8 words)",
  "subtitle": "optional date, team, or context",
  "summary": "2–3 sentence executive summary",
  "topics": [
    {
      "title": "topic title (≤8 words)",
      "summary": "2–3 sentences describing discussion and decisions",
      "keyDecision": "key decision/outcome, or null",
      "subtopics": ["detailed sub-point with context"],
      "actionItems": ["action: owner or team"]
    }
  ],
  "overallActionItems": ["action not tied to a specific topic"]
}

Rules:
- topics: one entry per selected topic (or extract from transcript if none selected)
- subtopics: 3–6 specific points per topic. Full sentences preferred.
- Be specific — use names, numbers, dates if present in transcript.
- Empty arrays for missing action items.`;

      userMessage = `Create a meeting document from this transcript.${topicsSection}${researchSection}${customClause}\n\n<transcript>\n${transcript}\n</transcript>`;
    }

    // Stream from Claude
    let fullText = "";
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        fullText += chunk.delta.text;
      }
    }

    const cleaned = fullText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Claude returned invalid JSON");
    }

    const parsedObj = parsed as Record<string, unknown>;

    if (outputFormat === "presentation") {
      const slides = Array.isArray(parsedObj.slides) ? parsedObj.slides : [];
      const validSlides = slides
        .slice(0, 12)
        .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
        .map((s) => ({
          title: typeof s.title === "string" ? s.title : "Slide",
          bullets: Array.isArray(s.bullets)
            ? (s.bullets as unknown[]).filter((b): b is string => typeof b === "string").slice(0, 10)
            : [],
          notes: typeof s.notes === "string" ? s.notes : undefined,
          chart: validChart(s.chart),
          mermaid:
            typeof s.mermaid === "string" && s.mermaid.trim()
              ? s.mermaid.trim().slice(0, 2000)
              : undefined,
        }));

      const deckData: DeckData = {
        title: typeof parsedObj.title === "string" ? parsedObj.title : "Presentation",
        subtitle: typeof parsedObj.subtitle === "string" ? parsedObj.subtitle : undefined,
        slides:
          validSlides.length >= 3
            ? validSlides
            : validSlides.concat(
                Array.from({ length: Math.max(0, 3 - validSlides.length) }, (_, i) => ({
                  title: `Slide ${validSlides.length + i + 1}`,
                  bullets: ["Add content from transcript"],
                  notes: undefined as string | undefined,
                  chart: undefined as ReturnType<typeof validChart>,
                  mermaid: undefined as string | undefined,
                }))
              ),
      };
      return NextResponse.json({ html: buildRevealHtml(deckData) }, { headers: CORS_HEADERS });
    }

    if (outputFormat === "notes") {
      const sectionsRaw = Array.isArray(parsedObj.sections) ? parsedObj.sections : [];
      const validSections = sectionsRaw
        .slice(0, 8)
        .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
        .map((s) => ({
          heading: typeof s.heading === "string" ? s.heading : "Section",
          items: Array.isArray(s.items)
            ? (s.items as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 12)
            : [],
          chart: validChart(s.chart),
          mermaid:
            typeof s.mermaid === "string" && s.mermaid.trim()
              ? s.mermaid.trim().slice(0, 2000)
              : undefined,
        }))
        .filter((s) => s.items.length > 0 || s.chart || s.mermaid);

      const notesData: NotesData = {
        title: typeof parsedObj.title === "string" ? parsedObj.title : "Meeting Notes",
        subtitle: typeof parsedObj.subtitle === "string" ? parsedObj.subtitle : undefined,
        sections:
          validSections.length >= 1
            ? validSections
            : [{ heading: "Summary", items: ["Add content from transcript"] }],
      };
      return NextResponse.json({ html: buildNotesHtml(notesData) }, { headers: CORS_HEADERS });
    }

    // Meeting document — return the structured JSON for client-side rendering
    // (or could return HTML directly using buildMeetingDoc from a shared location)
    return NextResponse.json({ data: parsedObj, format: "doc" }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
