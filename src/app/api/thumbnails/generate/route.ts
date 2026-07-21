import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getVideoMonthlyLimit, planIncludesVideo } from "@/lib/plan";
import { startOfMonth } from "@/lib/scheduling/engine";
import { ThumbnailGenerateSchema } from "@/lib/validation/thumbnail";
import { generateThumbnail } from "@/lib/ai/thumbnail";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function hashContent(
  prompt: string,
  ratio: string,
  overlayText: string,
  photoBuffer: Buffer | null,
): string {
  const hash = createHash("sha256").update(`${ratio}\n${prompt}\n${overlayText}`);
  if (photoBuffer) hash.update(photoBuffer);
  return hash.digest("hex");
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Thumbnail generation shares the same OpenAI image budget and monthly
  // quota as video rendering (see src/lib/plan.ts) -- both are gated behind
  // the same plan check and counted against the same VideoRenderLog cap.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user || !planIncludesVideo(user.plan)) {
    return NextResponse.json(
      { error: "Thumbnail generation requires the Growth plan or higher." },
      { status: 403 },
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = ThumbnailGenerateSchema.safeParse({
    prompt: form.get("prompt"),
    ratio: form.get("ratio") ?? undefined,
    overlayText: form.get("overlayText") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { prompt, ratio, overlayText } = parsed.data;

  const photoFile = form.get("photo");
  let photoBuffer: Buffer | null = null;
  let photoType = "image/png";
  if (photoFile instanceof File && photoFile.size > 0) {
    if (photoFile.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Photo must be under 8MB." }, { status: 400 });
    }
    photoBuffer = Buffer.from(await photoFile.arrayBuffer());
    photoType = photoFile.type || "image/png";
  }

  const contentHash = hashContent(prompt, ratio, overlayText ?? "", photoBuffer);
  const cached = await prisma.videoRenderLog.findFirst({
    where: { userId, contentHash, videoUrl: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (cached?.videoUrl) {
    return NextResponse.json({ cached: true, url: cached.videoUrl });
  }

  const limit = getVideoMonthlyLimit(user.plan);
  const usedThisMonth = await prisma.videoRenderLog.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });
  if (usedThisMonth >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} AI generations included in your plan this month. It resets next month, or upgrade for more.`,
      },
      { status: 429 },
    );
  }

  try {
    const imageBuffer = await generateThumbnail(
      prompt,
      ratio,
      photoBuffer ? { buffer: photoBuffer, type: photoType } : undefined,
      overlayText,
    );

    const blob = await put(`thumbnails/${userId}/${crypto.randomUUID()}.png`, imageBuffer, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
    });

    await prisma.videoRenderLog.create({
      data: { userId, contentHash, videoUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Thumbnail generation failed" },
      { status: 502 },
    );
  }
}
