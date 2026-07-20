import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { pickTrends } from "@/lib/theme";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ trends: pickTrends(5) });
}
