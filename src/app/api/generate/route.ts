import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { generateContent } from "@/lib/ai/generate";
import { GenerateRequestSchema } from "@/lib/validation/generate";
import { planIncludesVideo } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { checkApiRateLimit } from "@/lib/api-rate-limit";

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Unlike video/image/thumbnail generation, text drafts aren't counted
  // against a monthly quota ledger -- without this, the endpoint has no cap
  // on how many real LLM calls a single account can trigger.
  const allowed = await checkApiRateLimit(userId, "generate", {
    windowMs: 5 * 60 * 1000,
    max: 20,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "You're generating too quickly. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  if (parsed.data.type === "VIDEO") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (!user || !planIncludesVideo(user.plan)) {
      return NextResponse.json(
        { error: "Video generation requires the Growth plan or higher." },
        { status: 403 },
      );
    }
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { brandIndustry: true, brandToneDescription: true, brandExamplePosts: true },
  });

  const result = await generateContent(parsed.data, {
    industry: settings?.brandIndustry,
    toneDescription: settings?.brandToneDescription,
    examplePosts: settings?.brandExamplePosts,
  });

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
