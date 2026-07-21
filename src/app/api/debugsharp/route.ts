import { NextResponse } from "next/server";
import sharp from "sharp";

// Temporary: diagnose whether production's sharp build supports SVG
// rasterization (rsvg) for the thumbnail text-overlay compositing bug.
export async function GET() {
  const svg = Buffer.from(
    `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="red"/><text x="10" y="100" font-size="30" fill="white">HI</text></svg>`,
  );
  let svgRasterOk = false;
  let svgError: string | null = null;
  let pixelSample: number[] | null = null;
  try {
    const { data, info } = await sharp(svg).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    svgRasterOk = true;
    const idx = (100 * info.width + 100) * info.channels;
    pixelSample = Array.from(data.subarray(idx, idx + info.channels));
  } catch (err) {
    svgError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    versions: sharp.versions,
    svgRasterOk,
    svgError,
    pixelSample,
  });
}
