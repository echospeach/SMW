import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "node:fs";

// Temporary: diagnose whether production's sharp build (resvg-based wasm
// build) supports SVG gradients / text the way the thumbnail overlay needs.
async function sample(svg: string, points: Array<[number, number]>) {
  try {
    const { data, info } = await sharp(Buffer.from(svg))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return {
      ok: true,
      samples: points.map(([x, y]) => {
        const idx = (y * info.width + x) * info.channels;
        return Array.from(data.subarray(idx, idx + info.channels));
      }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  const solidRect = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="red"/></svg>`;

  const gradientRect = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12151C" stop-opacity="0" />
      <stop offset="100%" stop-color="#12151C" stop-opacity="0.88" />
    </linearGradient></defs>
    <rect width="200" height="200" fill="url(#scrim)" />
  </svg>`;

  const plainText = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><text x="10" y="100" font-size="60" fill="white">HI</text></svg>`;

  const arialText = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><text x="10" y="100" font-size="60" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="white">HI</text></svg>`;

  const [solid, gradient, plain, arial] = await Promise.all([
    sample(solidRect, [[100, 100]]),
    sample(gradientRect, [[100, 10], [100, 190]]),
    sample(plainText, [[20, 80], [100, 100]]),
    sample(arialText, [[20, 80], [100, 100]]),
  ]);

  function tryResolve(id: string) {
    try {
      return { ok: true, path: require.resolve(id) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  const candidates = [
    "@img/sharp-linux-x64/lib/sharp-linux-x64.node",
    "@img/sharp-linuxmusl-x64/lib/sharp-linuxmusl-x64.node",
    "@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.42",
    "@img/sharp-libvips-linuxmusl-x64/lib/libvips-cpp.so.42",
    "sharp/package.json",
  ];
  const resolves = Object.fromEntries(candidates.map((c) => [c, tryResolve(c)]));

  let libcInfo: string | null = null;
  try {
    libcInfo = fs.existsSync("/lib/ld-musl-x86_64.so.1")
      ? "musl (ld-musl-x86_64.so.1 present)"
      : fs.existsSync("/lib64/ld-linux-x86-64.so.2") || fs.existsSync("/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2")
        ? "glibc (ld-linux present)"
        : "unknown";
  } catch (err) {
    libcInfo = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    arch: process.arch,
    platform: process.platform,
    libcInfo,
    versions: sharp.versions,
    resolves,
    solid,
    gradient,
    plain,
    arial,
  });
}
