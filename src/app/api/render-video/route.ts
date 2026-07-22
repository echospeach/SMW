import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { RenderVideoSchema } from "@/lib/validation/render-video";
import { getVideoMonthlyLimit, planIncludesVideo } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "@/lib/scheduling/engine";
import { consumeBonusCredit, getAvailableBonusCredits } from "@/lib/referral";

function hashContent(script: string, ratio: string): string {
  return createHash("sha256").update(`${ratio}\n${script}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user || !planIncludesVideo(user.plan)) {
    return NextResponse.json(
      { error: "Video generation requires the Growth plan or higher." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RenderVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // An identical re-render (e.g. an accidental second click of "Re-render"
  // with nothing changed) returns the prior video for free instead of paying
  // for a fresh image + narration set.
  const contentHash = hashContent(parsed.data.script, parsed.data.ratio);
  const cached = await prisma.videoRenderLog.findFirst({
    where: { userId, contentHash, videoUrl: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (cached?.videoUrl) {
    return NextResponse.json({ cached: true, videoUrl: cached.videoUrl });
  }

  const baseLimit = getVideoMonthlyLimit(user.plan);
  const bonusCredits = await getAvailableBonusCredits(userId);
  const usedThisMonth = await prisma.videoRenderLog.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });
  if (usedThisMonth >= baseLimit + bonusCredits) {
    return NextResponse.json(
      {
        error: `You've used all ${baseLimit + bonusCredits} video renders included in your plan this month. It resets next month, or upgrade for more.`,
      },
      { status: 429 },
    );
  }

  const res = await fetch(`${process.env.RENDERER_URL}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-render-secret": process.env.RENDER_SECRET ?? "",
    },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to start render" }, { status: 502 });
  }

  const { jobId } = await res.json();
  // Logged now, not on completion -- the OpenAI cost is incurred as soon as
  // the renderer accepts the job, regardless of whether the render ultimately
  // succeeds or the video ever gets scheduled. videoUrl is filled in once the
  // job completes (see [jobId]/route.ts), which is what makes future
  // identical-content requests cacheable.
  await prisma.videoRenderLog.create({ data: { userId, contentHash, jobId } });
  if (usedThisMonth >= baseLimit) await consumeBonusCredit(userId);

  return NextResponse.json({ jobId }, { status: 202 });
}
