import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getConnector } from "@/lib/connectors/registry";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { userId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: { metrics: { orderBy: { fetchedAt: "desc" }, take: 1 } },
  });

  const result = posts.map((post) => {
    // A platform only has real analytics once its connector implements
    // fetchMetrics -- never fabricate numbers for still-mocked platforms.
    const metricsAvailable = Boolean(getConnector(post.platformId).fetchMetrics);
    const latest = post.metrics[0];
    return {
      id: post.id,
      platformId: post.platformId,
      text: post.text,
      type: post.type,
      publishedAt: post.publishedAt,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      metricsAvailable,
      metrics: metricsAvailable && latest
        ? {
            impressions: latest.impressions,
            likes: latest.likes,
            comments: latest.comments,
            shares: latest.shares,
            views: latest.views,
            fetchedAt: latest.fetchedAt,
          }
        : null,
    };
  });

  return NextResponse.json({ posts: result });
}
