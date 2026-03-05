import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildRevealHtml, DeckData } from "./revealTemplate";

export const maxDuration = 60;

// Zod schema for structured output
const SlideSchema = z.object({
  title: z.string().describe("Slide heading (concise, ≤8 words)"),
  bullets: z
    .array(z.string())
    .describe("3-5 bullet points summarising key points for this slide"),
  notes: z
    .string()
    .optional()
    .describe("Optional speaker notes with more detail"),
});

const DeckSchema = z.object({
  title: z.string().describe("Short, memorable presentation title"),
  subtitle: z.string().optional().describe("Optional subtitle or date"),
  slides: z
    .array(SlideSchema)
    .min(3)
    .max(12)
    .describe("Between 3 and 12 content slides"),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function isClaudeKey(key: string): boolean {
  return key.startsWith("sk-ant-");
}

function buildPrompts(
  transcript: string,
  selectedPoints: string[],
  customPrompt: string
): { system: string; user: string } {
  const pointsClause =
    selectedPoints.length > 0
      ? `\n\nFocus specifically on these discussion points selected by the user:\n${selectedPoints.map((p) => `- ${p}`).join("\n")}\n`
      : "";

  const customClause = customPrompt
    ? `\n\nAdditional instructions from the user:\n${customPrompt}\n`
    : "";

  const system = `You are an expert at distilling meeting transcripts into clear, concise presentations.
Given a meeting transcript, extract the key discussion points, decisions, and action items,
then organise them into a logical slide structure.${pointsClause}${customClause}
Guidelines:
- Title slide is handled separately — only return content slides
- Each slide should cover one coherent topic
- Bullets should be concise and scannable (not full sentences)
- Include speaker notes for context that doesn't fit on slides
- End with an "Action Items" or "Next Steps" slide if applicable`;

  const user = `Here is the meeting transcript. Please create a presentation deck from it:

<transcript>
${transcript}
</transcript>`;

  return { system, user };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      transcript?: string;
      selectedPoints?: string[];
      customPrompt?: string;
    };

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json(
        { error: "Missing transcript in request body" },
        { status: 400 }
      );
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
    const userApiKey = req.headers.get("X-Api-Key") ?? "";

    console.log(
      `[/api/generate-deck] Generating deck for transcript (${transcript.length} chars), ${selectedPoints.length} selected points`
    );

    const { system: systemPrompt, user: userPrompt } = buildPrompts(
      transcript,
      selectedPoints,
      customPrompt
    );

    let deckData: DeckData;

    if (userApiKey && isClaudeKey(userApiKey)) {
      // --- Claude path ---
      const anthropic = new Anthropic({ apiKey: userApiKey });
      const jsonInstruction =
        '\n\nRespond ONLY with valid JSON matching this schema: { "title": string, "subtitle"?: string, "slides": [{ "title": string, "bullets": string[], "notes"?: string }] }';

      const msg = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        system: systemPrompt + jsonInstruction,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.4,
      });

      const rawText = msg.content[0].type === "text" ? msg.content[0].text : "{}";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Claude returned no valid JSON");

      try {
        deckData = DeckSchema.parse(JSON.parse(jsonMatch[0]));
      } catch (err) {
        console.error("[/api/generate-deck] Claude schema validation failed:", err);
        throw new Error("Claude returned invalid structure");
      }
    } else {
      // --- OpenAI path ---
      const apiKey =
        userApiKey && !isClaudeKey(userApiKey) ? userApiKey : process.env.OPENAI_API_KEY;
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const rawJson = completion.choices[0].message.content;
      if (!rawJson) throw new Error("GPT-4o returned empty content");

      try {
        deckData = DeckSchema.parse(JSON.parse(rawJson) as unknown);
      } catch (err) {
        console.error("[/api/generate-deck] OpenAI schema validation failed:", err, rawJson);
        throw new Error("GPT-4o returned invalid structure");
      }
    }

    const html = buildRevealHtml(deckData);
    return NextResponse.json({ html });
  } catch (err: unknown) {
    console.error("[/api/generate-deck] Error:", err);
    const message = err instanceof Error ? err.message : "Deck generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
