import sharp from "sharp";
import satori from "satori";
import type { ReactNode } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { toFile } from "openai";
import type { Ratio } from "@/generated/prisma/enums";
import { openai } from "./openai-client";

// Vercel's serverless Node runtime resolves `sharp` to its portable
// resvg/wasm build rather than the native linux binary, which has no system
// fonts available -- resvg can't rasterize <text> at all there. satori
// sidesteps this by pre-shaping the text into vector <path> outlines using a
// font we ship ourselves, so rasterization never needs font lookup.
let overlayFontPromise: Promise<Buffer> | null = null;
function loadOverlayFont(): Promise<Buffer> {
  if (!overlayFontPromise) {
    overlayFontPromise = readFile(path.join(process.cwd(), "src/lib/ai/fonts/overlay-font.ttf"));
  }
  return overlayFontPromise;
}

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

// Vercel's Node runtime has thrown "ArrayBuffer: SharedArrayBuffer is not
// allowed" from sharp's native binding when handed a Buffer backed by a
// pooled/shared allocation (e.g. straight out of Buffer.from(base64,
// "base64")) -- force a genuinely fresh, non-pooled copy before it ever
// reaches sharp.
function toSafeBuffer(buf: Buffer): Buffer {
  return Buffer.from(Uint8Array.prototype.slice.call(buf));
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
  const paddingBottom = Math.round((scrimHeight - blockHeight) / 2);

  const scrimSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#12151C" stop-opacity="0" />
        <stop offset="100%" stop-color="#12151C" stop-opacity="0.88" />
      </linearGradient>
    </defs>
    <rect x="0" y="${height - scrimHeight}" width="${width}" height="${scrimHeight}" fill="url(#scrim)" />
  </svg>`;

  const fontData = await loadOverlayFont();
  const textTree = {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom,
        gap: lineHeight - fontSize,
      },
      children: lines.map((line) => ({
        type: "div",
        props: {
          style: {
            fontSize,
            fontWeight: 700,
            color: "#EDE9DD",
            lineHeight: 1,
            textAlign: "center" as const,
          },
          children: line,
        },
      })),
    },
  };
  const textSvg = await satori(textTree as unknown as ReactNode, {
    width,
    height,
    fonts: [{ name: "Overlay", data: fontData, weight: 700, style: "normal" }],
  });

  const safeImage = toSafeBuffer(image);
  const safeScrim = toSafeBuffer(Buffer.from(scrimSvg, "utf-8"));
  const safeText = toSafeBuffer(Buffer.from(textSvg, "utf-8"));

  return sharp(safeImage)
    .composite([
      { input: safeScrim, top: 0, left: 0 },
      { input: safeText, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
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
