import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";
export const maxDuration = 30;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
    },
  });
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-Api-Key") ?? process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key. Add your Anthropic key in Decker settings." },
      { status: 401 }
    );
  }

  const body = (await req.json()) as { topic?: string; transcript?: string };
  if (!body.topic || typeof body.topic !== "string") {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }

  const topic = body.topic.trim();
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";

  const client = new Anthropic({ apiKey });

  const system = `You are a research assistant helping enrich a meeting document. Given a discussion topic and meeting transcript, provide a brief, insightful research summary.

Return ONLY a JSON object:
{
  "context": "1–2 sentences of background context for this topic",
  "keyInsight": "The single most important takeaway or decision from the meeting on this topic",
  "subtopics": ["specific sub-point 1", "specific sub-point 2", "specific sub-point 3"]
}

Be specific and concrete. Draw from the transcript. Each subtopic under 10 words.`;

  const userMessage = `Research this meeting topic: "${topic}"${transcript ? `\n\n<transcript>\n${transcript}\n</transcript>` : ""}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content.find((c) => c.type === "text")?.text ?? "{}";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Claude returned invalid JSON");
    }

    const r = parsed as Record<string, unknown>;
    return NextResponse.json(
      {
        context: typeof r.context === "string" ? r.context : "",
        keyInsight: typeof r.keyInsight === "string" ? r.keyInsight : "",
        subtopics: Array.isArray(r.subtopics)
          ? (r.subtopics as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 5)
          : [],
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
