import { toFile } from "openai";
import type { Ratio } from "@/generated/prisma/enums";
import { openai } from "./openai-client";

const SIZE_BY_RATIO: Record<Ratio, "1024x1536" | "1024x1024" | "1536x1024"> = {
  PORTRAIT: "1024x1536",
  SQUARE: "1024x1024",
  LANDSCAPE: "1536x1024",
};

// No reference photo: straight text-to-image.
async function generateFromPrompt(prompt: string, ratio: Ratio): Promise<Buffer> {
  const response = await openai.images.generate({
    model: "gpt-image-1.5",
    prompt,
    size: SIZE_BY_RATIO[ratio],
    quality: "low",
    n: 1,
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data");
  return Buffer.from(b64, "base64");
}

// With a reference photo: image-editing so the result is based on the
// user's own picture instead of generated from scratch.
async function editFromPhoto(prompt: string, ratio: Ratio, photo: Buffer, photoType: string): Promise<Buffer> {
  const file = await toFile(photo, "reference.png", { type: photoType });
  const response = await openai.images.edit({
    model: "gpt-image-1.5",
    image: file,
    prompt,
    size: SIZE_BY_RATIO[ratio],
    quality: "low",
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image edit returned no data");
  return Buffer.from(b64, "base64");
}

export async function generateThumbnail(
  prompt: string,
  ratio: Ratio,
  photo?: { buffer: Buffer; type: string },
): Promise<Buffer> {
  return photo ? editFromPhoto(prompt, ratio, photo.buffer, photo.type) : generateFromPrompt(prompt, ratio);
}
