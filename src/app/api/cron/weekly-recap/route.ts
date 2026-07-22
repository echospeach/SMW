import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCronFailureAlert, sendWeeklyRecapEmail } from "@/lib/email/send";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = new Date(Date.now() - WEEK_MS);
    const users = await prisma.user.findMany({ select: { id: true } });

    let sent = 0;
    for (const user of users) {
      const [published, scheduled, topPost] = await Promise.all([
        prisma.post.count({ where: { userId: user.id, status: "PUBLISHED", publishedAt: { gte: since } } }),
        prisma.post.count({ where: { userId: user.id, status: "SCHEDULED" } }),
        prisma.post.findFirst({
          where: { userId: user.id, status: "PUBLISHED", publishedAt: { gte: since } },
          include: { metrics: { orderBy: { fetchedAt: "desc" }, take: 1 } },
          orderBy: { publishedAt: "desc" },
        }),
      ]);

      if (published === 0 && scheduled === 0) continue;

      await sendWeeklyRecapEmail(user.id, {
        published,
        scheduled,
        topPostText: topPost?.text,
      });
      sent++;
    }

    await prisma.cronRun.create({ data: { name: "weekly-recap", ok: true, summary: { sent } } });
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    await prisma.cronRun.create({ data: { name: "weekly-recap", ok: false, error: String(err) } });
    await sendCronFailureAlert("weekly-recap", String(err));
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
