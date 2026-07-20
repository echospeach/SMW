import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { generateContent } from "@/lib/ai/generate";
import { GenerateRequestSchema } from "@/lib/validation/generate";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await generateContent(parsed.data);

  if (result.kind === "refused") {
    return NextResponse.json(
      { error: "This request couldn't be generated. Try rephrasing the topic." },
      { status: 422 },
    );
  }
  if (result.kind === "video") {
    return NextResponse.json({ script: result.script, duration: result.duration });
  }
  return NextResponse.json({ draft: result.draft });
}
