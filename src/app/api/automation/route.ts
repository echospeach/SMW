import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rules, settings] = await Promise.all([
    prisma.automationRule.findMany({ where: { userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  return NextResponse.json({ rules, autoTrending: settings?.autoTrending ?? true });
}
