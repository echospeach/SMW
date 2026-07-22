import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const OnboardingPatchSchema = z.object({ dismissed: z.boolean() });

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = OnboardingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingDismissed: parsed.data.dismissed },
  });

  return NextResponse.json({ ok: true });
}
