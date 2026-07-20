import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { AutomationPatchSchema } from "@/lib/validation/automation";
import { PlatformIdParam } from "@/lib/validation/platform";

type RouteParams = { params: Promise<{ platform: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await params;
  const parsedPlatform = PlatformIdParam.safeParse(platform.toUpperCase());
  if (!parsedPlatform.success) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AutomationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const platformId = parsedPlatform.data;
  const rule = await prisma.automationRule.upsert({
    where: { userId_platformId: { userId, platformId } },
    update: parsed.data,
    create: {
      userId,
      platformId,
      enabled: parsed.data.enabled ?? false,
      times: parsed.data.times ?? [],
    },
  });

  return NextResponse.json({ rule });
}
