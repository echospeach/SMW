import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";
import { getVideoMonthlyLimit } from "@/lib/plan";
import { startOfMonth } from "@/lib/scheduling/engine";
import { ContentStudio } from "@/components/studio/content-studio";

export default async function StudioPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const [connections, user] = await Promise.all([
    prisma.socialConnection.findMany({ where: { userId, connected: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
  ]);
  const plan = user?.plan ?? "STARTER";

  const videoRendersUsed = await prisma.videoRenderLog.count({
    where: { userId, createdAt: { gte: startOfMonth(new Date()) } },
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Content Studio
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Brief it, generate it, schedule it.
      </p>
      <div className="mt-6">
        <ContentStudio
          connectedPlatforms={connections.map((c) => c.platformId)}
          plan={plan}
          videoRendersUsed={videoRendersUsed}
          videoRendersLimit={getVideoMonthlyLimit(plan)}
        />
      </div>
    </div>
  );
}
