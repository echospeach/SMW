import OpenAI from "openai";
import type { Ratio } from "./remotion/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const IMAGE_SIZE_BY_RATIO: Record<Ratio, "1024x1536" | "1024x1024" | "1536x1024"> = {
  PORTRAIT: "1024x1536",
  SQUARE: "1024x1024",
  LANDSCAPE: "1536x1024",
};

export async function generateBeatImage(beatText: string, ratio: Ratio): Promise<Buffer> {
  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt: `Cinematic, photorealistic scene illustrating: "${beatText}". Professional product/lifestyle photography, natural lighting, shallow depth of field. No text, no words, no logos, no watermarks anywhere in the image.`,
    size: IMAGE_SIZE_BY_RATIO[ratio],
    quality: "medium",
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
