import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { GenerateRequestSchema } from "@/lib/validation/generate";

// Placeholder templates until M5 wires this up to the real Claude API.
// The request/response contract here is the one the real endpoint will keep.
function buildStubDraft(topic: string, tone: string, trendLabel?: string) {
  const trendPhrase = trendLabel ? `, tying it into "${trendLabel}"` : "";
  const templates: Record<string, string> = {
    CONFIDENT: `${topic} — and we're not just saying that${trendPhrase}. Here's why it matters this week.`,
    PLAYFUL: `Ok but has anyone else noticed ${topic.toLowerCase()}${trendLabel ? ` right as "${trendLabel.toLowerCase()}" is everywhere` : ""}? asking for a friend`,
    INFORMATIVE: `A quick breakdown of ${topic.toLowerCase()}${trendPhrase}: what's changing, and what it means for you.`,
  };
  return templates[tone] ?? `${topic} — here's the story behind it.`;
}

function buildStubScript(topic: string, tone: string, trendLabel?: string) {
  const trendPhrase = trendLabel ? `, tying it into "${trendLabel}"` : "";
  const scripts: Record<string, string> = {
    CONFIDENT: `[Hook] ${topic} — here's what nobody's telling you${trendPhrase}.\n[Beat 1] The problem, in one shot.\n[Beat 2] What we did differently.\n[CTA] Follow for the full story.`,
    PLAYFUL: `[Hook] POV: ${topic.toLowerCase()}${trendLabel ? ` meets ${trendLabel.toLowerCase()}` : ""}\n[Beat 1] cut to the chaos\n[Beat 2] cut to the payoff\n[CTA] tell us we're not the only ones`,
    INFORMATIVE: `[Hook] Let's break down ${topic.toLowerCase()} in under 30 seconds${trendPhrase}.\n[Beat 1] The context.\n[Beat 2] The 3 things that matter.\n[CTA] Save this for later.`,
  };
  return scripts[tone] ?? `${topic} — the short version.`;
}

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

  const { type, topic, tone, selectedTrend } = parsed.data;
  const trendLabel = selectedTrend?.label;

  if (type === "VIDEO") {
    const seconds = 15 + Math.floor(Math.random() * 30);
    const duration = `0:${seconds < 10 ? "0" : ""}${seconds}`;
    return NextResponse.json({ script: buildStubScript(topic, tone, trendLabel), duration });
  }

  return NextResponse.json({ draft: buildStubDraft(topic, tone, trendLabel) });
}
