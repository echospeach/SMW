import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const SettingsPatchSchema = z.object({
  autoTrending: z.boolean().optional(),
  notifyOnPublish: z.boolean().optional(),
  notifyOnFailure: z.boolean().optional(),
  notifyWeeklyRecap: z.boolean().optional(),
  brandIndustry: z.string().max(200).optional(),
  brandToneDescription: z.string().max(2000).optional(),
  brandExamplePosts: z.array(z.string().max(2000)).max(10).optional(),
});

const DEFAULTS = {
  autoTrending: true,
  notifyOnPublish: true,
  notifyOnFailure: true,
  notifyWeeklyRecap: true,
};

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return NextResponse.json({
    autoTrending: settings?.autoTrending ?? DEFAULTS.autoTrending,
    notifyOnPublish: settings?.notifyOnPublish ?? DEFAULTS.notifyOnPublish,
    notifyOnFailure: settings?.notifyOnFailure ?? DEFAULTS.notifyOnFailure,
    notifyWeeklyRecap: settings?.notifyWeeklyRecap ?? DEFAULTS.notifyWeeklyRecap,
    brandIndustry: settings?.brandIndustry ?? "",
    brandToneDescription: settings?.brandToneDescription ?? "",
    brandExamplePosts: settings?.brandExamplePosts ?? [],
  });
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
    update: parsed.data,
    create: { userId, ...DEFAULTS, ...parsed.data },
  });

  return NextResponse.json({
    autoTrending: settings.autoTrending,
    notifyOnPublish: settings.notifyOnPublish,
    notifyOnFailure: settings.notifyOnFailure,
    notifyWeeklyRecap: settings.notifyWeeklyRecap,
    brandIndustry: settings.brandIndustry ?? "",
    brandToneDescription: settings.brandToneDescription ?? "",
    brandExamplePosts: settings.brandExamplePosts,
  });
}
