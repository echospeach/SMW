import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AuthAttemptKind = "login" | "register" | "password_reset_request";

const WINDOWS: Record<AuthAttemptKind, { windowMs: number; maxPerIp: number; maxPerEmail?: number }> = {
  login: { windowMs: 15 * 60 * 1000, maxPerIp: 5, maxPerEmail: 5 },
  register: { windowMs: 60 * 60 * 1000, maxPerIp: 3 },
  password_reset_request: { windowMs: 60 * 60 * 1000, maxPerIp: 3 },
};

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export async function checkAuthRateLimit(
  kind: AuthAttemptKind,
  email?: string,
): Promise<{ allowed: boolean }> {
  const ip = await getClientIp();
  const { windowMs, maxPerIp, maxPerEmail } = WINDOWS[kind];
  const since = new Date(Date.now() - windowMs);

  const ipCount = await prisma.authAttempt.count({
    where: { ip, kind, createdAt: { gte: since } },
  });
  if (ipCount >= maxPerIp) return { allowed: false };

  if (maxPerEmail && email) {
    const emailCount = await prisma.authAttempt.count({
      where: { email: email.toLowerCase(), kind, createdAt: { gte: since } },
    });
    if (emailCount >= maxPerEmail) return { allowed: false };
  }

  return { allowed: true };
}

export async function recordAuthAttempt(
  kind: AuthAttemptKind,
  succeeded: boolean,
  email?: string,
): Promise<void> {
  const ip = await getClientIp();
  await prisma.authAttempt.create({
    data: { kind, ip, email: email?.toLowerCase(), succeeded },
  });
}
