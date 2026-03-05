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

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: "Missing audio file in form data" }, { status: 400 });
    }
    if (audioFile.size === 0) {
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Audio file too large (${Math.round(audioFile.size / 1024 / 1024)}MB). Max 25MB.` },
        { status: 413 }
      );
    }

    console.log(`[/api/transcribe] Transcribing ${audioFile.name}, size: ${audioFile.size} bytes`);

    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err: unknown) {
    console.error("[/api/transcribe] Error:", err);
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
