import { describe, expect, it } from "vitest";
import { computeOnboardingProgress } from "@/lib/onboarding";

describe("computeOnboardingProgress", () => {
  it("marks nothing done for a brand new user", () => {
    const { steps, allDone } = computeOnboardingProgress({
      hasConnection: false,
      hasGeneratedContent: false,
      hasScheduledPost: false,
    });
    expect(steps.every((s) => !s.done)).toBe(true);
    expect(allDone).toBe(false);
  });

  it("marks each step independently as its signal completes", () => {
    const { steps } = computeOnboardingProgress({
      hasConnection: true,
      hasGeneratedContent: true,
      hasScheduledPost: false,
    });
    expect(steps.find((s) => s.key === "connect_account")?.done).toBe(true);
    expect(steps.find((s) => s.key === "generate_content")?.done).toBe(true);
    expect(steps.find((s) => s.key === "schedule_post")?.done).toBe(false);
  });

  it("is allDone only once every signal is true", () => {
    const { allDone } = computeOnboardingProgress({
      hasConnection: true,
      hasGeneratedContent: true,
      hasScheduledPost: true,
    });
    expect(allDone).toBe(true);
  });
});
