import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function isClaudeKey(key: string): boolean {
  return key.startsWith("sk-ant-");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { transcript?: string };

    if (!body.transcript || typeof body.transcript !== "string") {
      return NextResponse.json(
        { error: "Missing transcript in request body" },
        { status: 400 }
      );
    }

    const transcript = body.transcript.trim();
    const userApiKey = req.headers.get("X-Api-Key") ?? "";

    const systemPrompt = `You are an expert meeting analyst. Given a meeting transcript, extract the 5–12 most important discussion points, decisions, or topics covered. Each point should be a concise phrase (under 15 words) that clearly describes a specific topic discussed. Return ONLY a JSON array of strings, e.g.: ["Topic A", "Topic B"]`;

    const userPrompt = `Extract the key discussion points from this transcript:\n\n<transcript>\n${transcript}\n</transcript>`;

    let points: string[];

    if (userApiKey && isClaudeKey(userApiKey)) {
      const anthropic = new Anthropic({ apiKey: userApiKey });
      const msg = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";
      const match = text.match(/\[[\s\S]*\]/);
      points = match ? (JSON.parse(match[0]) as string[]) : [];
    } else {
      const apiKey = userApiKey && !isClaudeKey(userApiKey) ? userApiKey : process.env.OPENAI_API_KEY;
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      const raw = completion.choices[0].message.content ?? "{}";
      const parsed = JSON.parse(raw) as { points?: string[] } | string[];
      points = Array.isArray(parsed) ? parsed : (parsed as { points?: string[] }).points ?? [];
    }

    // Ensure we have an array of strings
    points = points.filter((p) => typeof p === "string").slice(0, 12);

    console.log(`[/api/extract-points] Extracted ${points.length} points`);
    return NextResponse.json({ points });
  } catch (err: unknown) {
    console.error("[/api/extract-points] Error:", err);
    const message = err instanceof Error ? err.message : "Point extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
