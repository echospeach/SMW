import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getConnector } from "@/lib/connectors/registry";
import { prisma } from "@/lib/prisma";
import { PlatformIdParam } from "@/lib/validation/platform";

type RouteParams = { params: Promise<{ platform: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await params;
  const parsed = PlatformIdParam.safeParse(platform.toUpperCase());
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }
  const platformId = parsed.data;

  let handle: string;
  try {
    ({ handle } = await getConnector(platformId).connect(userId));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to connect" },
      { status: 400 },
    );
  }

  const connection = await prisma.socialConnection.upsert({
    where: { userId_platformId: { userId, platformId } },
    update: { connected: true, handle, connectedAt: new Date() },
    create: { userId, platformId, connected: true, handle, connectedAt: new Date() },
  });

  return NextResponse.json({ connection });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await params;
  const parsed = PlatformIdParam.safeParse(platform.toUpperCase());
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }
  const platformId = parsed.data;

  await getConnector(platformId).disconnect(userId);

  const connection = await prisma.socialConnection.upsert({
    where: { userId_platformId: { userId, platformId } },
    update: { connected: false, handle: null, connectedAt: null },
    create: { userId, platformId, connected: false },
  });

  return NextResponse.json({ connection });
}
