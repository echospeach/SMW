import { anthropic } from "@/lib/ai/client";
import type { GenerateRequest } from "@/lib/validation/generate";

const SYSTEM_PROMPT = `You are the AI writing assistant inside SMW, a social media scheduling tool.
Given a brief (content type, topic, tone, target platforms, and an optional trending topic to
weave in), write a single ready-to-post draft. Match the requested tone exactly. Keep captions
punchy and platform-appropriate — no hashtag spam, no emoji overuse, no generic marketing fluff.
Never include meta-commentary about being an AI or about this being a draft.
For video requests, format the output as a short-form video script using bracketed beat labels
like [Hook], [Beat 1], [Beat 2], [CTA].
Output only the caption or script text itself — no preamble, no surrounding quotation marks, no
markdown formatting.`;

const TONE_LABEL: Record<GenerateRequest["tone"], string> = {
  CONFIDENT: "Confident",
  PLAYFUL: "Playful",
  INFORMATIVE: "Informative",
};

export type BrandVoice = {
  industry?: string | null;
  toneDescription?: string | null;
  examplePosts?: string[];
};

function buildUserPrompt(req: GenerateRequest, brandVoice?: BrandVoice): string {
  const lines = [
    `Content type: ${req.type}`,
    `Topic: ${req.topic}`,
    `Tone: ${TONE_LABEL[req.tone]}`,
  ];
  if (req.targetPlatforms.length > 0) {
    lines.push(`Target platforms: ${req.targetPlatforms.join(", ")}`);
  }
  if (req.selectedTrend) {
    lines.push(
      `Weave in this trending topic where it fits naturally: "${req.selectedTrend.label}"`,
    );
  }
  if (brandVoice?.industry) {
    lines.push(`This brand's industry: ${brandVoice.industry}`);
  }
  if (brandVoice?.toneDescription) {
    lines.push(`This brand's distinctive voice, described by the owner: ${brandVoice.toneDescription}`);
  }
  if (brandVoice?.examplePosts && brandVoice.examplePosts.length > 0) {
    lines.push(
      `Example posts from this brand to match the style of (don't copy them, match the voice):\n${brandVoice.examplePosts.map((p) => `- ${p}`).join("\n")}`,
    );
  }
  return lines.join("\n");
}

function randomVideoDuration(): string {
  const seconds = 15 + Math.floor(Math.random() * 30);
  return `0:${seconds < 10 ? "0" : ""}${seconds}`;
}

export type GenerateResult =
  | { kind: "text"; draft: string }
  | { kind: "video"; script: string; duration: string }
  | { kind: "refused" };

export async function generateContent(
  req: GenerateRequest,
  brandVoice?: BrandVoice,
): Promise<GenerateResult> {
  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
    max_tokens: req.type === "VIDEO" ? 500 : 250,
    thinking: { type: "disabled" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(req, brandVoice) }],
  });

  if (message.stop_reason === "refusal") {
    return { kind: "refused" };
  }

  const text = message.content.find((block) => block.type === "text")?.text?.trim() ?? "";

  if (req.type === "VIDEO") {
    return { kind: "video", script: text, duration: randomVideoDuration() };
  }
  return { kind: "text", draft: text };
}
