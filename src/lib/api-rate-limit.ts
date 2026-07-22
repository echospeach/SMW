import { prisma } from "@/lib/prisma";

// Burst-rate limiter for authenticated API endpoints that cost real money per
// call (AI/LLM generation) but aren't already bounded by a monthly quota
// ledger. Separate from src/lib/rate-limit.ts, which is IP/email-keyed for
// unauthenticated auth flows -- this is per-user, for logged-in abuse.
export async function checkApiRateLimit(
  userId: string,
  endpoint: string,
  { windowMs, max }: { windowMs: number; max: number },
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.apiCallLog.count({
    where: { userId, endpoint, createdAt: { gte: since } },
  });
  if (count >= max) return false;

  await prisma.apiCallLog.create({ data: { userId, endpoint } });
  return true;
}
