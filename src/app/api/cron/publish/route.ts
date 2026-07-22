import { NextRequest, NextResponse } from "next/server";
import { getConnector } from "@/lib/connectors/registry";
import { prisma } from "@/lib/prisma";
import { isSlotDue, startOfDay } from "@/lib/scheduling/engine";
import { sendCronFailureAlert, sendPostFailedEmail, sendPostPublishedEmail } from "@/lib/email/send";
import { isValidCronSecret } from "@/lib/cron-auth";

async function publishDueQueueItems() {
  const due = await prisma.post.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
  });

  let published = 0;
  let failed = 0;

  for (const post of due) {
    try {
      const result = await getConnector(post.platformId).publish(post.userId, {
        text: post.text,
        type: post.type,
        ratio: post.ratio,
        duration: post.duration,
        videoUrl: post.videoUrl,
        imageUrl: post.imageUrl,
      });
      // Scope the update to status: "SCHEDULED" so a concurrent invocation can't double-publish this row.
      const updated = await prisma.post.updateMany({
        where: { id: post.id, status: "SCHEDULED" },
        data: {
          status: "PUBLISHED",
          publishedAt: result.publishedAt,
          externalPostId: result.externalPostId,
        },
      });
      if (updated.count > 0) {
        published++;
        await sendPostPublishedEmail(post.userId, post.platformId, post.text);
      }
    } catch (err) {
      await prisma.post.updateMany({
        where: { id: post.id, status: "SCHEDULED" },
        data: { status: "FAILED", failureReason: String(err) },
      });
      failed++;
      await sendPostFailedEmail(post.userId, post.platformId, post.text, String(err));
    }
  }

  return { published, failed };
}

async function runAutomationSlots() {
  const now = new Date();
  const fireDate = startOfDay(now);
  const rules = await prisma.automationRule.findMany({ where: { enabled: true } });

  let fired = 0;
  let skipped = 0;

  for (const rule of rules) {
    for (const slot of rule.times) {
      if (!isSlotDue(slot, now)) continue;

      // Claim the slot for today first — the unique constraint on
      // (automationRuleId, fireDate, slot) is what makes this safe against an
      // overlapping or retried cron invocation double-firing the same slot.
      const claimed = await prisma.automationFireLog
        .create({ data: { automationRuleId: rule.id, fireDate, slot } })
        .catch(() => null);
      if (!claimed) continue;

      // Pull the oldest approved draft from the content pipeline for this platform.
      // No draft ready -> the slot is skipped, not filled with junk (see Automation screen copy).
      const draft = await prisma.post.findFirst({
        where: { userId: rule.userId, platformId: rule.platformId, status: "DRAFT" },
        orderBy: { createdAt: "asc" },
      });

      if (!draft) {
        skipped++;
        continue;
      }

      try {
        const result = await getConnector(rule.platformId).publish(rule.userId, {
          text: draft.text,
          type: draft.type,
          ratio: draft.ratio,
          duration: draft.duration,
          videoUrl: draft.videoUrl,
          imageUrl: draft.imageUrl,
        });
        await prisma.post.update({
          where: { id: draft.id },
          data: {
            status: "PUBLISHED",
            publishedAt: result.publishedAt,
            externalPostId: result.externalPostId,
            sourceAutomationRuleId: rule.id,
          },
        });
        fired++;
        await sendPostPublishedEmail(rule.userId, rule.platformId, draft.text);
      } catch (err) {
        await prisma.post.update({
          where: { id: draft.id },
          data: { status: "FAILED", failureReason: String(err), sourceAutomationRuleId: rule.id },
        });
        await sendPostFailedEmail(rule.userId, rule.platformId, draft.text, String(err));
      }
    }
  }

  return { fired, skipped };
}

export async function GET(req: NextRequest) {
  if (!isValidCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queueResult = await publishDueQueueItems();
    const automationResult = await runAutomationSlots();
    const summary = { queue: queueResult, automation: automationResult };

    await prisma.cronRun.create({ data: { name: "publish", ok: true, summary } });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    await prisma.cronRun.create({ data: { name: "publish", ok: false, error: String(err) } });
    await sendCronFailureAlert("publish", String(err));
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
