import { getPlatformMeta } from "@/lib/theme";
import type { PlatformId } from "@/generated/prisma/enums";

function wrap(title: string, body: string, footer?: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#12151C">
    <h2 style="margin:0 0 12px">${title}</h2>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#8890A0">
      ${footer ?? "You're receiving this because you have notifications turned on in SMW settings."}
    </p>
  </div>`;
}

export function postPublishedTemplate(platformId: PlatformId, text: string) {
  const platform = getPlatformMeta(platformId).name;
  const subject = `Your post just went live on ${platform}`;
  const html = wrap(
    subject,
    `<p style="margin:0 0 8px;color:#4a5568">"${text.slice(0, 200)}"</p>
     <p style="margin:0;color:#4a5568">It's published and visible on ${platform} now.</p>`,
  );
  const text_ = `${subject}\n\n"${text.slice(0, 200)}"\n\nIt's published and visible on ${platform} now.`;
  return { subject, html, text: text_ };
}

export function postFailedTemplate(platformId: PlatformId, text: string, reason: string) {
  const platform = getPlatformMeta(platformId).name;
  const subject = `A scheduled post to ${platform} failed`;
  const html = wrap(
    subject,
    `<p style="margin:0 0 8px;color:#4a5568">"${text.slice(0, 200)}"</p>
     <p style="margin:0 0 8px;color:#E2645A">${reason}</p>
     <p style="margin:0;color:#4a5568">Check your Accounts connection and try scheduling it again.</p>`,
  );
  const text_ = `${subject}\n\n"${text.slice(0, 200)}"\n\n${reason}\n\nCheck your Accounts connection and try scheduling it again.`;
  return { subject, html, text: text_ };
}

export function passwordResetTemplate(resetUrl: string) {
  const subject = "Reset your SMW password";
  const html = wrap(
    subject,
    `<p style="margin:0 0 8px;color:#4a5568">Click the button below to set a new password. This link expires in 1 hour.</p>
     <p style="margin:16px 0">
       <a href="${resetUrl}" style="display:inline-block;background:#F2A93B;color:#12151C;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
     </p>
     <p style="margin:0;color:#4a5568;font-size:13px">Or paste this link into your browser: ${resetUrl}</p>`,
    "If you didn't request this, you can safely ignore this email — your password won't change.",
  );
  const text_ = `${subject}\n\nOpen this link to set a new password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  return { subject, html, text: text_ };
}

export function cronFailureTemplate(cronName: string, error: string) {
  const subject = `Cron job "${cronName}" failed`;
  const html = wrap(
    subject,
    `<p style="margin:0 0 8px;color:#4a5568">The "${cronName}" cron job threw an unhandled error:</p>
     <p style="margin:0;color:#E2645A;font-family:monospace;font-size:13px">${error}</p>`,
    "Sent automatically to SMW's operator email whenever a cron run fails.",
  );
  const text_ = `${subject}\n\nThe "${cronName}" cron job threw an unhandled error:\n${error}`;
  return { subject, html, text: text_ };
}

export function weeklyRecapTemplate(stats: { published: number; scheduled: number; topPostText?: string }) {
  const subject = "Your week on SMW";
  const html = wrap(
    subject,
    `<p style="margin:0 0 8px;color:#4a5568">${stats.published} post${stats.published === 1 ? "" : "s"} published, ${stats.scheduled} queued for next week.</p>
     ${stats.topPostText ? `<p style="margin:0;color:#4a5568">Top performer: "${stats.topPostText.slice(0, 150)}"</p>` : ""}`,
  );
  const text_ = `${subject}\n\n${stats.published} posts published, ${stats.scheduled} queued for next week.${stats.topPostText ? `\n\nTop performer: "${stats.topPostText.slice(0, 150)}"` : ""}`;
  return { subject, html, text: text_ };
}
