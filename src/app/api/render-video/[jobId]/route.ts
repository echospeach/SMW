import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;

  const res = await fetch(`${process.env.RENDERER_URL}/jobs/${jobId}`, {
    headers: { "x-render-secret": process.env.RENDER_SECRET ?? "" },
  });

  if (res.status === 404) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch render status" }, { status: 502 });
  }

  const job = await res.json();
  return NextResponse.json(job);
}
