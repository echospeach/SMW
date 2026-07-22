import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";
import { getConnector } from "@/lib/connectors/registry";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default async function AnalyticsPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const posts = await prisma.post.findMany({
    where: { userId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: { metrics: { orderBy: { fetchedAt: "desc" }, take: 1 } },
  });

  const rows = posts.map((post) => {
    const metricsAvailable = Boolean(getConnector(post.platformId).fetchMetrics);
    const latest = post.metrics[0];
    return {
      id: post.id,
      platformId: post.platformId,
      text: post.text,
      type: post.type,
      publishedAt: post.publishedAt,
      imageUrl: post.imageUrl,
      metricsAvailable,
      metrics: metricsAvailable && latest
        ? {
            impressions: latest.impressions,
            likes: latest.likes,
            comments: latest.comments,
            shares: latest.shares,
            views: latest.views,
          }
        : null,
    };
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Analytics
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        How your published posts are performing.
      </p>
      <div className="mt-6">
        <AnalyticsView posts={rows} />
      </div>
    </div>
  );
}
