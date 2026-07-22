import { NextRequest, NextResponse } from "next/server";
import { getConnector } from "@/lib/connectors/registry";
import { prisma } from "@/lib/prisma";
import { sendCronFailureAlert } from "@/lib/email/send";

const LOOKBACK_DAYS = 30;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED", externalPostId: { not: null }, publishedAt: { gte: since } },
    });

    let fetched = 0;
    let skipped = 0;

    for (const post of posts) {
      const connector = getConnector(post.platformId);
      if (!connector.fetchMetrics || !post.externalPostId) {
        skipped++;
        continue;
      }
      try {
        const metrics = await connector.fetchMetrics(post.userId, post.externalPostId);
        if (!metrics) {
          skipped++;
          continue;
        }
        await prisma.postMetric.create({
          data: {
            postId: post.id,
            impressions: metrics.impressions,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            views: metrics.views,
          },
        });
        fetched++;
      } catch {
        // One platform/token hiccup shouldn't abort the batch for everyone else.
        skipped++;
      }
    }

    const summary = { fetched, skipped };
    await prisma.cronRun.create({ data: { name: "metrics", ok: true, summary } });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    await prisma.cronRun.create({ data: { name: "metrics", ok: false, error: String(err) } });
    await sendCronFailureAlert("metrics", String(err));
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
