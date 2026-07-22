import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkAvatarVideoStatus } from "@/lib/avatar/heygen";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;

  // Without this, any authenticated user could poll any other user's jobId
  // and read back their rendered avatar video URL.
  const owned = await prisma.avatarRenderLog.findFirst({ where: { userId, heygenVideoId: jobId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let job;
  try {
    job = await checkAvatarVideoStatus(jobId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch render status" },
      { status: 502 },
    );
  }

  // Fill in the completed videoUrl so an identical future render can be
  // served from cache instead of paying HeyGen for a new one.
  if (job.status === "completed" && job.videoUrl) {
    await prisma.avatarRenderLog.updateMany({
      where: { userId, heygenVideoId: jobId },
      data: { videoUrl: job.videoUrl },
    });
  }

  return NextResponse.json(job);
}
