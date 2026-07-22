import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getAvailableBonusCredits } from "@/lib/referral";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, referredCount, bonusCreditsAvailable] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }),
    prisma.user.count({ where: { referredByUserId: userId } }),
    getAvailableBonusCredits(userId),
  ]);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inviteUrl = `${process.env.APP_URL ?? ""}/register?ref=${user.referralCode}`;

  return NextResponse.json({
    code: user.referralCode,
    inviteUrl,
    referredCount,
    bonusCreditsAvailable,
  });
}
