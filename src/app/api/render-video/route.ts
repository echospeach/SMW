import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { RenderVideoSchema } from "@/lib/validation/render-video";
import { getVideoMonthlyLimit, planIncludesVideo } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "@/lib/scheduling/engine";

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

  const limit = getVideoMonthlyLimit(user.plan);
  const usedThisMonth = await prisma.videoRenderLog.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });
  if (usedThisMonth >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} video renders included in your plan this month. It resets next month, or upgrade for more.`,
      },
      { status: 429 },
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
  // succeeds or the video ever gets scheduled.
  await prisma.videoRenderLog.create({ data: { userId } });

  return NextResponse.json({ jobId }, { status: 202 });
}
