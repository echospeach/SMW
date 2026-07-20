import OpenAI from "openai";
import type { Ratio } from "./remotion/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const IMAGE_MODEL = process.env.IMAGE_MODEL ?? "gpt-image-1.5";

const IMAGE_SIZE_BY_RATIO: Record<Ratio, "1024x1536" | "1024x1024" | "1536x1024"> = {
  PORTRAIT: "1024x1536",
  SQUARE: "1024x1024",
  LANDSCAPE: "1536x1024",
};

// One hero image per video (not per beat) -- reused across every beat with a
// different pan/zoom per beat in VideoTemplate.tsx, the way real product/ad
// videos usually work rather than a new photo every few seconds. Cuts image
// generation calls (the dominant cost) by ~75-80% per video.
export async function generateHeroImage(prompt: string, ratio: Ratio): Promise<Buffer> {
  const response = await client.images.generate({
    model: IMAGE_MODEL,
    prompt: `Cinematic, photorealistic scene illustrating: "${prompt}". Professional product/lifestyle photography, natural lighting, shallow depth of field. No text, no words, no logos, no watermarks anywhere in the image.`,
    size: IMAGE_SIZE_BY_RATIO[ratio],
    quality: "low",
    n: 1,
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data");
  return Buffer.from(b64, "base64");
}

export async function generateBeatAudio(beatText: string): Promise<Buffer> {
  const response = await client.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: beatText,
    response_format: "mp3",
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
