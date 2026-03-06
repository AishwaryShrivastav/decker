import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildRevealHtml, DeckData } from "./revealTemplate";
import { buildNotesHtml, NotesData } from "./notesTemplate";

export const maxDuration = 60;

export type OutputFormat = "presentation" | "notes";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("X-Api-Key") ?? process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key provided. Add your OpenAI key in the Decker extension settings (⚙)." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      transcript?: string;
      selectedPoints?: string[];
      customPrompt?: string;
      backgroundColor?: string;
      outputFormat?: OutputFormat;
    };

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json({ error: "Missing transcript in request body" }, { status: 400 });
    }

    const transcript = body.transcript.trim();
    if (transcript.length < 50) {
      return NextResponse.json(
        { error: "Transcript is too short to generate a meaningful deck" },
        { status: 400 }
      );
    }

    const selectedPoints = Array.isArray(body.selectedPoints) ? body.selectedPoints : [];
    const customPrompt = typeof body.customPrompt === "string" ? body.customPrompt : "";
    const outputFormat: OutputFormat =
      body.outputFormat === "notes" ? "notes" : "presentation";

    let backgroundColor: string | undefined;
    if (outputFormat === "presentation") {
      backgroundColor = typeof body.backgroundColor === "string" ? body.backgroundColor.trim().toLowerCase() : undefined;
      if (!backgroundColor && /green\s*(background|theme|slide)/i.test(customPrompt)) backgroundColor = "green";
      if (!backgroundColor && /blue\s*(background|theme|slide)/i.test(customPrompt)) backgroundColor = "blue";
      if (!backgroundColor && /light\s*(background|theme|slide)/i.test(customPrompt)) backgroundColor = "light";
    }

    const pointsClause =
      selectedPoints.length > 0
        ? `\n\nFocus specifically on these discussion points selected by the user:\n${selectedPoints.map((p) => `- ${p}`).join("\n")}\n`
        : "";

    const customClause = customPrompt ? `\n\nAdditional instructions: ${customPrompt}\n` : "";

    console.log(
      `[/api/generate-deck] Generating ${outputFormat} (${transcript.length} chars, ${selectedPoints.length} selected points)`
    );

    const openai = new OpenAI({ apiKey });

    if (outputFormat === "notes") {
      const notesSystemPrompt = `You are an expert at distilling meeting transcripts into clear, well-structured meeting notes with infographics. Extract key discussion points, decisions, and action items. Add charts or diagrams where they add value.

Return ONLY valid JSON with this exact structure (no extra fields, no markdown):
{"title":"string","subtitle":"optional string","sections":[{"heading":"string","items":["string"],"chart":optional,"mermaid":optional}]}

Rules:
- "title": concise meeting title
- "subtitle": optional (date, meeting name)
- "sections": array of 3-6 sections. Each has "heading", "items" (3-8 bullets), and optionally:
  - "chart": when numeric breakdown exists (budgets, allocations, votes, %). Format: {"type":"pie"|"bar"|"line"|"doughnut","title":"optional","labels":["A","B"],"values":[40,60]}
  - "mermaid": when process/timeline/flow exists. Use flowchart, timeline, or sequenceDiagram. Example: "flowchart LR\\n  A[Start] --> B[Review] --> C[Approve]"
- Add chart or mermaid to 1-2 sections max if transcript supports it. Omit if not relevant.
- End with "Action Items" or "Next Steps"
${pointsClause}${customClause}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: notesSystemPrompt },
          {
            role: "user",
            content: `Create meeting notes from this transcript. Return a JSON object only.\n\n<transcript>\n${transcript}\n</transcript>`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      let rawJson = completion.choices[0].message.content;
      if (!rawJson) throw new Error("GPT-4o returned empty content");
      rawJson = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        throw new Error("GPT-4o returned invalid JSON");
      }

      const parsedObj = parsed as Record<string, unknown>;
      const sectionsRaw = Array.isArray(parsedObj.sections) ? parsedObj.sections : [];
      const validSections = sectionsRaw
        .slice(0, 8)
        .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
        .map((s) => {
          const chart = s.chart as Record<string, unknown> | undefined;
          const validChart =
            chart &&
            typeof chart === "object" &&
            Array.isArray(chart.labels) &&
            Array.isArray(chart.values) &&
            chart.labels.length === chart.values.length
              ? {
                  type: (["bar", "pie", "line", "doughnut"].includes(String(chart.type)) ? (chart.type as "bar" | "pie" | "line" | "doughnut") : "bar") as "bar" | "pie" | "line" | "doughnut",
                  title: typeof chart.title === "string" ? chart.title : undefined,
                  labels: (chart.labels as unknown[]).filter((l): l is string => typeof l === "string").slice(0, 12),
                  values: (chart.values as unknown[]).filter((v): v is number => typeof v === "number" && !Number.isNaN(v)).slice(0, 12),
                }
              : undefined;
          const mermaid = typeof s.mermaid === "string" && s.mermaid.trim() ? s.mermaid.trim().slice(0, 2000) : undefined;
          return {
            heading: typeof s.heading === "string" ? s.heading : "Section",
            items: Array.isArray(s.items)
              ? (s.items as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 12)
              : [],
            chart: validChart,
            mermaid,
          };
        })
        .filter((s) => s.items.length > 0 || s.chart || s.mermaid);

      const notesData: NotesData = {
        title: typeof parsedObj.title === "string" ? parsedObj.title : "Meeting Notes",
        subtitle: typeof parsedObj.subtitle === "string" ? parsedObj.subtitle : undefined,
        sections: validSections.length >= 1 ? validSections : [{ heading: "Summary", items: ["Add content from transcript"] }],
      };

      const html = buildNotesHtml(notesData);
      return NextResponse.json({ html });
    }

    // Presentation (Reveal.js)
    const systemPrompt = `You are an expert at distilling meeting transcripts into clear, concise presentations with infographics. Extract key discussion points, decisions, and action items. Add charts or diagrams where they add value.

Return ONLY valid JSON with this exact structure (no extra fields, no markdown):
{"title":"string","subtitle":"optional string","slides":[{"title":"string","bullets":["string"],"notes":"optional string","chart":optional,"mermaid":optional}]}

Rules:
- "title": short deck title
- "subtitle": optional (date, meeting name)
- "slides": array of 3-12 slides. Each slide has "title" (≤8 words), "bullets" (3-5 strings), "notes" (optional), and optionally:
  - "chart": when numeric breakdown exists (budgets, allocations, votes, %). Format: {"type":"pie"|"bar"|"line"|"doughnut","title":"optional","labels":["A","B"],"values":[40,60]}
  - "mermaid": when process/timeline/flow exists. Use flowchart, timeline, or sequenceDiagram. Example: "flowchart LR\\n  A[Start] --> B[Review] --> C[Approve]"
- Add chart or mermaid to 1-2 slides max if transcript supports it. Omit if not relevant.
- No title slide in slides — we add it separately
- End with "Action Items" or "Next Steps" slide
${pointsClause}${customClause}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create a presentation deck from this meeting transcript. Return a JSON object only.\n\n<transcript>\n${transcript}\n</transcript>`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    let rawJson = completion.choices[0].message.content;
    if (!rawJson) throw new Error("GPT-4o returned empty content");
    rawJson = rawJson.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error("GPT-4o returned invalid JSON");
    }

    const parsedObj = parsed as Record<string, unknown>;
    const slides = Array.isArray(parsedObj.slides) ? parsedObj.slides : [];
    const validSlides = slides
      .slice(0, 12)
      .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
      .map((s) => {
        const chart = s.chart as Record<string, unknown> | undefined;
        const validChart =
          chart &&
          typeof chart === "object" &&
          Array.isArray(chart.labels) &&
          Array.isArray(chart.values) &&
          chart.labels.length === chart.values.length
            ? {
                type: (["bar", "pie", "line", "doughnut"].includes(String(chart.type)) ? (chart.type as "bar" | "pie" | "line" | "doughnut") : "bar") as "bar" | "pie" | "line" | "doughnut",
                title: typeof chart.title === "string" ? chart.title : undefined,
                labels: (chart.labels as unknown[]).filter((l): l is string => typeof l === "string").slice(0, 12),
                values: (chart.values as unknown[]).filter((v): v is number => typeof v === "number" && !Number.isNaN(v)).slice(0, 12),
              }
            : undefined;
        const mermaid = typeof s.mermaid === "string" && s.mermaid.trim() ? s.mermaid.trim().slice(0, 2000) : undefined;
        return {
          title: typeof s.title === "string" ? s.title : "Slide",
          bullets: Array.isArray(s.bullets)
            ? (s.bullets as unknown[]).filter((b): b is string => typeof b === "string").slice(0, 10)
            : [],
          notes: typeof s.notes === "string" ? s.notes : undefined,
          chart: validChart,
          mermaid,
        };
      });

    const deckData: DeckData = {
      title: typeof parsedObj.title === "string" ? parsedObj.title : "Presentation",
      subtitle: typeof parsedObj.subtitle === "string" ? parsedObj.subtitle : undefined,
      slides: validSlides.length >= 3 ? validSlides : validSlides.concat(
        Array.from({ length: Math.max(0, 3 - validSlides.length) }, (_, i) => ({
          title: `Slide ${validSlides.length + i + 1}`,
          bullets: ["Add content from transcript"],
          notes: undefined as string | undefined,
        }))
      ),
    };

    const html = buildRevealHtml(deckData, backgroundColor);
    return NextResponse.json({ html });
  } catch (err: unknown) {
    console.error("[/api/generate-deck] Error:", err);
    const message = err instanceof Error ? err.message : "Deck generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
