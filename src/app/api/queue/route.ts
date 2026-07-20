import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { QueueCreateSchema } from "@/lib/validation/queue";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { userId },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = QueueCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { targets, scheduledAt, ...rest } = parsed.data;

  const posts = await prisma.$transaction(
    targets.map((platformId) =>
      prisma.post.create({
        data: {
          ...rest,
          userId,
          platformId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
      }),
    ),
  );

  return NextResponse.json({ posts }, { status: 201 });
}
