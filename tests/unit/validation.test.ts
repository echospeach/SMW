import { describe, expect, it } from "vitest";
import { AutomationPatchSchema } from "@/lib/validation/automation";
import { GenerateRequestSchema } from "@/lib/validation/generate";
import { PlatformIdParam } from "@/lib/validation/platform";
import { QueueCreateSchema, QueuePatchSchema } from "@/lib/validation/queue";
import { RegisterSchema } from "@/lib/validation/auth";

describe("PlatformIdParam", () => {
  it("accepts every real platform id", () => {
    for (const id of ["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TIKTOK", "YOUTUBE"]) {
      expect(PlatformIdParam.safeParse(id).success).toBe(true);
    }
  });

  it("rejects an unknown platform", () => {
    expect(PlatformIdParam.safeParse("MASTODON").success).toBe(false);
  });

  it("is case-sensitive (callers must uppercase first)", () => {
    expect(PlatformIdParam.safeParse("facebook").success).toBe(false);
  });
});

describe("AutomationPatchSchema", () => {
  it("accepts a valid HH:mm time slot list", () => {
    const result = AutomationPatchSchema.safeParse({ enabled: true, times: ["09:00", "23:59"] });
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range hour", () => {
    expect(AutomationPatchSchema.safeParse({ times: ["25:00"] }).success).toBe(false);
  });

  it("rejects an out-of-range minute", () => {
    expect(AutomationPatchSchema.safeParse({ times: ["09:60"] }).success).toBe(false);
  });

  it("rejects a single-digit hour without a leading zero", () => {
    expect(AutomationPatchSchema.safeParse({ times: ["9:00"] }).success).toBe(false);
  });

  it("allows omitting either field (partial patch)", () => {
    expect(AutomationPatchSchema.safeParse({}).success).toBe(true);
    expect(AutomationPatchSchema.safeParse({ enabled: false }).success).toBe(true);
  });
});

describe("GenerateRequestSchema", () => {
  const base = {
    type: "TEXT_POST",
    topic: "a new product",
    tone: "CONFIDENT",
    targetPlatforms: ["FACEBOOK"],
  };

  it("accepts a minimal valid request", () => {
    expect(GenerateRequestSchema.safeParse(base).success).toBe(true);
  });

  it("accepts an optional selectedTrend", () => {
    const result = GenerateRequestSchema.safeParse({
      ...base,
      selectedTrend: { label: "Founder story reels", heat: "high", tag: "format" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty topic", () => {
    expect(GenerateRequestSchema.safeParse({ ...base, topic: "" }).success).toBe(false);
  });

  it("rejects an empty targetPlatforms array", () => {
    expect(GenerateRequestSchema.safeParse({ ...base, targetPlatforms: [] }).success).toBe(false);
  });

  it("rejects an unknown tone", () => {
    expect(GenerateRequestSchema.safeParse({ ...base, tone: "SARCASTIC" }).success).toBe(false);
  });
});

describe("QueueCreateSchema", () => {
  const base = { text: "hello world", targets: ["FACEBOOK"] };

  it("defaults status to SCHEDULED and type to TEXT_POST", () => {
    const result = QueueCreateSchema.parse(base);
    expect(result.status).toBe("SCHEDULED");
    expect(result.type).toBe("TEXT_POST");
  });

  it("rejects an empty targets array", () => {
    expect(QueueCreateSchema.safeParse({ ...base, targets: [] }).success).toBe(false);
  });

  it("rejects an invalid scheduledAt string", () => {
    expect(QueueCreateSchema.safeParse({ ...base, scheduledAt: "not-a-date" }).success).toBe(false);
  });

  it("accepts a valid ISO scheduledAt", () => {
    expect(
      QueueCreateSchema.safeParse({ ...base, scheduledAt: "2026-08-01T10:00:00.000Z" }).success,
    ).toBe(true);
  });
});

describe("QueuePatchSchema", () => {
  it("allows an empty patch", () => {
    expect(QueuePatchSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an empty text update", () => {
    expect(QueuePatchSchema.safeParse({ text: "" }).success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  it("accepts a valid email and an 8+ character password", () => {
    expect(RegisterSchema.safeParse({ email: "a@b.com", password: "longenough" }).success).toBe(
      true,
    );
  });

  it("rejects a malformed email", () => {
    expect(
      RegisterSchema.safeParse({ email: "not-an-email", password: "longenough" }).success,
    ).toBe(false);
  });

  it("rejects a too-short password", () => {
    expect(RegisterSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(false);
  });
});
