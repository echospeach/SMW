import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const SettingsPatchSchema = z.object({
  autoTrending: z.boolean(),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return NextResponse.json({ autoTrending: settings?.autoTrending ?? true });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: { autoTrending: parsed.data.autoTrending },
    create: { userId, autoTrending: parsed.data.autoTrending },
  });

  return NextResponse.json({ autoTrending: settings.autoTrending });
}
