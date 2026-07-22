import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getVideoMonthlyLimit, planIncludesVideo } from "@/lib/plan";
import { startOfMonth } from "@/lib/scheduling/engine";
import { GenerateImageSchema } from "@/lib/validation/generate-image";
import { generateThumbnail } from "@/lib/ai/thumbnail";
import { consumeBonusCredit, getAvailableBonusCredits } from "@/lib/referral";

function hashContent(prompt: string, ratio: string): string {
  return createHash("sha256").update(`${ratio}\n${prompt}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Content Studio image generation shares the same OpenAI image budget and
  // monthly quota as thumbnails/video (see src/lib/plan.ts) -- all three are
  // gated behind the same plan check and counted against VideoRenderLog.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user || !planIncludesVideo(user.plan)) {
    return NextResponse.json(
      { error: "Image generation requires the Growth plan or higher." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = GenerateImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { prompt, ratio } = parsed.data;

  const contentHash = hashContent(prompt, ratio);
  const cached = await prisma.videoRenderLog.findFirst({
    where: { userId, contentHash, videoUrl: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (cached?.videoUrl) {
    return NextResponse.json({ cached: true, url: cached.videoUrl });
  }

  const baseLimit = getVideoMonthlyLimit(user.plan);
  const bonusCredits = await getAvailableBonusCredits(userId);
  const usedThisMonth = await prisma.videoRenderLog.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });
  if (usedThisMonth >= baseLimit + bonusCredits) {
    return NextResponse.json(
      {
        error: `You've used all ${baseLimit + bonusCredits} AI generations included in your plan this month. It resets next month, or upgrade for more.`,
      },
      { status: 429 },
    );
  }

  try {
    const imageBuffer = await generateThumbnail(prompt, ratio);
    const safeBuffer = Buffer.from(Uint8Array.prototype.slice.call(imageBuffer));

    const blob = await put(`post-images/${userId}/${crypto.randomUUID()}.png`, safeBuffer, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
    });

    await prisma.videoRenderLog.create({
      data: { userId, contentHash, videoUrl: blob.url },
    });
    if (usedThisMonth >= baseLimit) await consumeBonusCredit(userId);

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Image generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 502 },
    );
  }
}
