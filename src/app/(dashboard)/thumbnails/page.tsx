import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";
import { getVideoMonthlyLimit } from "@/lib/plan";
import { startOfMonth } from "@/lib/scheduling/engine";
import { ThumbnailStudio } from "@/components/thumbnails/thumbnail-studio";

export default async function ThumbnailsPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const plan = user?.plan ?? "STARTER";

  const used = await prisma.videoRenderLog.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Thumbnails
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Generate a standalone cover image — write your own prompt, or upload a photo to base it
        on.
      </p>
      <div className="mt-6">
        <ThumbnailStudio plan={plan} used={used} limit={getVideoMonthlyLimit(plan)} />
      </div>
    </div>
  );
}
