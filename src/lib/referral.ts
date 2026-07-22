import { prisma } from "@/lib/prisma";

export const REFERRAL_BONUS_GENERATIONS = 5;

export async function getAvailableBonusCredits(userId: string): Promise<number> {
  const credits = await prisma.referralCredit.findMany({ where: { userId } });
  return credits.reduce((total, c) => total + (c.amount - c.consumed), 0);
}

// Claims one unit of bonus credit against the oldest row that still has any
// left, so credits are used in the order they were granted. Prisma can't
// compare two columns of the same row in a `where` filter, so this fetches
// candidates and picks the first with room in application code.
export async function consumeBonusCredit(userId: string): Promise<void> {
  const credits = await prisma.referralCredit.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const credit = credits.find((c) => c.consumed < c.amount);
  if (!credit) return;
  await prisma.referralCredit.update({
    where: { id: credit.id },
    data: { consumed: { increment: 1 } },
  });
}

export async function grantReferralBonuses(referrerUserId: string, newUserId: string): Promise<void> {
  await prisma.referralCredit.createMany({
    data: [
      { userId: referrerUserId, amount: REFERRAL_BONUS_GENERATIONS, reason: "referrer_bonus" },
      { userId: newUserId, amount: REFERRAL_BONUS_GENERATIONS, reason: "signup_bonus" },
    ],
  });
}

export const PAID_TOPUP_GENERATIONS = 10;

// Grants into the same ledger as referral bonuses -- automatically picked
// up by getAvailableBonusCredits()/consumeBonusCredit() with no changes
// needed in any of the three quota-gated generation routes.
export async function grantPaidCredits(userId: string, amount: number): Promise<void> {
  await prisma.referralCredit.create({
    data: { userId, amount, reason: "paid_topup" },
  });
}
