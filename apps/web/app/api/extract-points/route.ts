import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

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

    const body = (await req.json()) as { transcript?: string };
    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json({ error: "Missing transcript in request body" }, { status: 400 });
    }

    const transcript = body.transcript.trim();

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert meeting analyst. Given a meeting transcript, extract the 5–12 most important discussion points, decisions, or topics covered. Each point should be a concise phrase (under 15 words). Return ONLY a JSON object with a single key \"points\" whose value is an array of strings. Example: {\"points\": [\"Q3 roadmap priorities\", \"Hiring two engineers\"]}",
        },
        {
          role: "user",
          content: `Extract the key discussion points from this transcript. Return a JSON object with a "points" array.\n\n<transcript>\n${transcript}\n</transcript>`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as { points?: unknown };
    const points = Array.isArray(parsed.points)
      ? (parsed.points as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 12)
      : [];

    console.log(`[/api/extract-points] Extracted ${points.length} points`);
    return NextResponse.json({ points });
  } catch (err: unknown) {
    console.error("[/api/extract-points] Error:", err);
    const message = err instanceof Error ? err.message : "Point extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
