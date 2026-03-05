import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { buildRevealHtml, DeckData } from "./revealTemplate";

export const maxDuration = 60;

const SlideSchema = z.object({
  title: z.string().describe("Slide heading (concise, ≤8 words)"),
  bullets: z.array(z.string()).describe("3-5 bullet points summarising key points for this slide"),
  notes: z.string().optional().describe("Optional speaker notes with more detail"),
});

const DeckSchema = z.object({
  title: z.string().describe("Short, memorable presentation title"),
  subtitle: z.string().optional().describe("Optional subtitle or date"),
  slides: z.array(SlideSchema).min(3).max(12).describe("Between 3 and 12 content slides"),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("X-Api-Key") ?? "";
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

    const pointsClause =
      selectedPoints.length > 0
        ? `\n\nFocus specifically on these discussion points selected by the user:\n${selectedPoints.map((p) => `- ${p}`).join("\n")}\n`
        : "";

    const customClause = customPrompt ? `\n\nAdditional instructions: ${customPrompt}\n` : "";

    const systemPrompt = `You are an expert at distilling meeting transcripts into clear, concise presentations. Extract key discussion points, decisions, and action items, then organise them into a logical slide structure.${pointsClause}${customClause}
Guidelines:
- Title slide is handled separately — only return content slides
- Each slide covers one coherent topic
- Bullets should be concise and scannable (not full sentences)
- Include speaker notes for context that doesn't fit on slides
- End with an "Action Items" or "Next Steps" slide if applicable`;

    console.log(
      `[/api/generate-deck] Generating deck (${transcript.length} chars, ${selectedPoints.length} selected points)`
    );

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create a presentation deck from this meeting transcript:\n\n<transcript>\n${transcript}\n</transcript>`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const rawJson = completion.choices[0].message.content;
    if (!rawJson) throw new Error("GPT-4o returned empty content");

    let deckData: DeckData;
    try {
      deckData = DeckSchema.parse(JSON.parse(rawJson) as unknown);
    } catch (err) {
      console.error("[/api/generate-deck] Schema validation failed:", err);
      throw new Error("GPT-4o returned invalid structure");
    }

    const html = buildRevealHtml(deckData);
    return NextResponse.json({ html });
  } catch (err: unknown) {
    console.error("[/api/generate-deck] Error:", err);
    const message = err instanceof Error ? err.message : "Deck generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
