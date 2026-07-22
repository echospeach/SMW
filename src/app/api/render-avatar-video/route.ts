import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { RenderAvatarVideoSchema } from "@/lib/validation/render-avatar-video";
import { getAvatarMonthlyLimit, planIncludesVideo } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "@/lib/scheduling/engine";
import { generateAvatarVideo } from "@/lib/avatar/heygen";
import { checkApiRateLimit } from "@/lib/api-rate-limit";

function hashContent(script: string, avatarId: string): string {
  return createHash("sha256").update(`${avatarId}\n${script}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, settings: { select: { heygenAvatarId: true, heygenVoiceId: true } } },
  });
  if (!user || !planIncludesVideo(user.plan)) {
    return NextResponse.json(
      { error: "Avatar video requires the Growth plan or higher." },
      { status: 403 },
    );
  }
  if (!user.settings?.heygenAvatarId) {
    return NextResponse.json(
      { error: "Add your HeyGen avatar in Settings first." },
      { status: 400 },
    );
  }

  const allowed = await checkApiRateLimit(userId, "render-avatar-video", {
    windowMs: 5 * 60 * 1000,
    max: 5,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "You're generating too quickly. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RenderAvatarVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // This pool is intentionally separate from the regular VideoRenderLog pool
  // (and its referral bonus credits) -- avatar videos cost ~20-80x more per
  // unit, so cheap referral credits never accidentally subsidize them.
  const avatarId = user.settings.heygenAvatarId;
  const contentHash = hashContent(parsed.data.script, avatarId);
  const cached = await prisma.avatarRenderLog.findFirst({
    where: { userId, contentHash, videoUrl: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (cached?.videoUrl) {
    return NextResponse.json({ cached: true, videoUrl: cached.videoUrl });
  }

  const limit = getAvatarMonthlyLimit(user.plan);
  const usedThisMonth = await prisma.avatarRenderLog.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });
  if (usedThisMonth >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} avatar videos included in your plan this month. It resets next month.`,
      },
      { status: 429 },
    );
  }

  try {
    const heygenVideoId = await generateAvatarVideo(
      avatarId,
      user.settings.heygenVoiceId ?? "",
      parsed.data.script,
    );
    await prisma.avatarRenderLog.create({ data: { userId, contentHash, heygenVideoId } });
    return NextResponse.json({ jobId: heygenVideoId }, { status: 202 });
  } catch (err) {
    console.error("Avatar video generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Avatar video generation failed" },
      { status: 502 },
    );
  }
}
