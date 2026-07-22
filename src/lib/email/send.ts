import type { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SUPPORT_EMAIL } from "@/lib/theme";
import { getResendClient } from "./resend-client";
import {
  cronFailureTemplate,
  passwordResetTemplate,
  postFailedTemplate,
  postPublishedTemplate,
  weeklyRecapTemplate,
} from "./templates";

const FROM = process.env.RESEND_FROM ?? "SMW <notifications@smw.app>";

async function getRecipient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, settings: true },
  });
  return user;
}

async function send(to: string, email: { subject: string; html: string; text: string }) {
  const resend = getResendClient();
  if (!resend) return; // RESEND_API_KEY not configured yet -- no-op, not an error.
  await resend.emails.send({ from: FROM, to, ...email }).catch((err) => {
    console.error("Failed to send email:", err);
  });
}

export async function sendPostPublishedEmail(userId: string, platformId: PlatformId, text: string) {
  const user = await getRecipient(userId);
  if (!user || user.settings?.notifyOnPublish === false) return;
  await send(user.email, postPublishedTemplate(platformId, text));
}

export async function sendPostFailedEmail(
  userId: string,
  platformId: PlatformId,
  text: string,
  reason: string,
) {
  const user = await getRecipient(userId);
  if (!user || user.settings?.notifyOnFailure === false) return;
  await send(user.email, postFailedTemplate(platformId, text, reason));
}

// Takes the email/URL directly rather than a userId -- the caller already
// decides whether to send at all (it deliberately doesn't reveal whether the
// account exists), so this stays a dumb, unconditional send like the others.
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await send(email, passwordResetTemplate(resetUrl));
}

// Operator alert, not a user notification -- sent unconditionally to
// SUPPORT_EMAIL, no UserSettings preference gate.
export async function sendCronFailureAlert(cronName: string, error: string) {
  await send(SUPPORT_EMAIL, cronFailureTemplate(cronName, error));
}

export async function sendWeeklyRecapEmail(
  userId: string,
  stats: { published: number; scheduled: number; topPostText?: string },
) {
  const user = await getRecipient(userId);
  if (!user || user.settings?.notifyWeeklyRecap === false) return;
  await send(user.email, weeklyRecapTemplate(stats));
}
