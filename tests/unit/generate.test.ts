import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerateRequest } from "@/lib/validation/generate";

const createMock = vi.fn();

vi.mock("@/lib/ai/client", () => ({
  anthropic: { messages: { create: (...args: unknown[]) => createMock(...args) } },
}));

const { generateContent } = await import("@/lib/ai/generate");

function baseRequest(overrides: Partial<GenerateRequest> = {}): GenerateRequest {
  return {
    type: "TEXT_POST",
    topic: "a new product launch",
    tone: "CONFIDENT",
    targetPlatforms: ["FACEBOOK"],
    ...overrides,
  };
}

beforeEach(() => {
  createMock.mockReset();
});

describe("generateContent", () => {
  it("returns a trimmed text draft for non-video requests", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "  A great caption.  " }],
    });

    const result = await generateContent(baseRequest());
    expect(result).toEqual({ kind: "text", draft: "A great caption." });
  });

  it("returns a script and a fabricated duration for video requests", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "[Hook] ...\n[CTA] ..." }],
    });

    const result = await generateContent(baseRequest({ type: "VIDEO" }));
    expect(result.kind).toBe("video");
    if (result.kind === "video") {
      expect(result.script).toContain("[Hook]");
      expect(result.duration).toMatch(/^0:\d{2}$/);
    }
  });

  it("surfaces a refusal without throwing", async () => {
    createMock.mockResolvedValue({ stop_reason: "refusal", content: [] });

    const result = await generateContent(baseRequest());
    expect(result).toEqual({ kind: "refused" });
  });

  it("uses max_tokens 250 for non-video and 500 for video, with thinking disabled", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "x" }],
    });

    await generateContent(baseRequest());
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 250, thinking: { type: "disabled" } }),
    );

    await generateContent(baseRequest({ type: "VIDEO" }));
    expect(createMock).toHaveBeenLastCalledWith(expect.objectContaining({ max_tokens: 500 }));
  });

  it("includes the selected trend in the prompt when provided", async () => {
    createMock.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "x" }],
    });

    await generateContent(
      baseRequest({ selectedTrend: { label: "Founder story reels", heat: "high", tag: "format" } }),
    );

    const callArgs = createMock.mock.calls[0]![0];
    const userMessage = callArgs.messages[0].content as string;
    expect(userMessage).toContain("Founder story reels");
  });
});
