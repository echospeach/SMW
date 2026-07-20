import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Stub: no Stripe integration yet. This just records the plan the user picked
// so the rest of the product (limits, UI) has something real to read.
const BillingPatchSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH", "SCALE"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BillingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      plan: parsed.data.plan,
      ...(parsed.data.billingCycle ? { billingCycle: parsed.data.billingCycle } : {}),
    },
    select: { plan: true, billingCycle: true },
  });

  return NextResponse.json(user);
}
