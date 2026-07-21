import sharp from "sharp";
import { toFile } from "openai";
import type { Ratio } from "@/generated/prisma/enums";
import { openai } from "./openai-client";

const SIZE_BY_RATIO: Record<Ratio, "1024x1536" | "1024x1024" | "1536x1024"> = {
  PORTRAIT: "1024x1536",
  SQUARE: "1024x1024",
  LANDSCAPE: "1536x1024",
};

const DIMENSIONS_BY_RATIO: Record<Ratio, { width: number; height: number }> = {
  PORTRAIT: { width: 1024, height: 1536 },
  SQUARE: { width: 1024, height: 1024 },
  LANDSCAPE: { width: 1536, height: 1024 },
};

// No reference photo: straight text-to-image.
async function generateFromPrompt(prompt: string, ratio: Ratio): Promise<Buffer> {
  let response;
  try {
    response = await openai.images.generate({
      model: "gpt-image-1.5",
      prompt,
      size: SIZE_BY_RATIO[ratio],
      quality: "low",
      n: 1,
    });
  } catch (err) {
    throw new Error(`STAGE=openai-call ${err instanceof Error ? err.message : String(err)}`);
  }
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data");
  try {
    return Buffer.from(b64, "base64");
  } catch (err) {
    throw new Error(`STAGE=b64-decode ${err instanceof Error ? err.message : String(err)}`);
  }
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

// Vercel's Node runtime has thrown "ArrayBuffer: SharedArrayBuffer is not
// allowed" from sharp's native binding when handed a Buffer backed by a
// pooled/shared allocation (e.g. straight out of Buffer.from(base64,
// "base64")) -- force a genuinely fresh, non-pooled copy before it ever
// reaches sharp.
function toSafeBuffer(buf: Buffer): Buffer {
  return Buffer.from(Uint8Array.prototype.slice.call(buf));
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// AI image models render text as garbled nonsense, so real overlay text is
// composited on afterward as an actual raster layer -- a dark scrim (matching
// the video template's treatment) behind bold, legible, word-wrapped text.
async function compositeTextOverlay(
  image: Buffer,
  text: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const fontSize = Math.round(width * 0.065);
  const maxCharsPerLine = Math.max(6, Math.floor(width / (fontSize * 0.56)));
  const lines = wrapText(text, maxCharsPerLine).slice(0, 6);
  const lineHeight = fontSize * 1.25;
  const blockHeight = lines.length * lineHeight;
  const scrimHeight = Math.min(height, blockHeight + height * 0.16);
  const firstBaselineY = height - scrimHeight + (scrimHeight - blockHeight) / 2 + fontSize * 0.85;

  const tspans = lines
    .map((line, i) => `<tspan x="50%" y="${firstBaselineY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#12151C" stop-opacity="0" />
        <stop offset="100%" stop-color="#12151C" stop-opacity="0.88" />
      </linearGradient>
    </defs>
    <rect x="0" y="${height - scrimHeight}" width="${width}" height="${scrimHeight}" fill="url(#scrim)" />
    <text font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fontSize}" fill="#EDE9DD" text-anchor="middle">
      ${tspans}
    </text>
  </svg>`;

  const safeImage = toSafeBuffer(image);
  const safeOverlay = toSafeBuffer(Buffer.from(svg, "utf-8"));

  try {
    await sharp(safeImage).png().toBuffer();
  } catch (err) {
    throw new Error(
      `STAGE=passthrough ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  try {
    return await sharp(safeImage)
      .composite([{ input: safeOverlay, top: 0, left: 0 }])
      .png()
      .toBuffer();
  } catch (err) {
    throw new Error(`STAGE=composite ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function generateThumbnail(
  prompt: string,
  ratio: Ratio,
  photo?: { buffer: Buffer; type: string },
  overlayText?: string,
): Promise<Buffer> {
  const base = photo
    ? await editFromPhoto(prompt, ratio, photo.buffer, photo.type)
    : await generateFromPrompt(prompt, ratio);

  const trimmed = overlayText?.trim();
  if (!trimmed) return base;

  const { width, height } = DIMENSIONS_BY_RATIO[ratio];
  return compositeTextOverlay(base, trimmed, width, height);
}
