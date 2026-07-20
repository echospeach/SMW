import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { RenderVideoSchema } from "@/lib/validation/render-video";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = RenderVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const res = await fetch(`${process.env.RENDERER_URL}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-render-secret": process.env.RENDER_SECRET ?? "",
    },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to start render" }, { status: 502 });
  }

  const { jobId } = await res.json();
  return NextResponse.json({ jobId }, { status: 202 });
}
