import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth";

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * channels * bitDepth) / 8, 28);
  header.writeUInt16LE((channels * bitDepth) / 8, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 5,000 character limit for TTS
    if (text.length > 5000) {
      return NextResponse.json({ error: "Text too long (max 5,000 characters)" }, { status: 413 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts", // Valid TTS model
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore", // Options: Puck, Charon, Kore, Fenrir, Aoede
            },
          },
        },
      },
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!data) {
      return NextResponse.json({ error: "No audio returned" }, { status: 500 });
    }

    const wav = pcmToWav(Buffer.from(data, "base64"));
    return new Response(new Uint8Array(wav), {
      headers: { "Content-Type": "audio/wav" },
    });
  } catch (error: any) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
