import { describe, expect, it } from "vitest";
import { computeQueueStats } from "@/lib/dashboard-stats";
import type { PostSummary } from "@/types";

function post(overrides: Partial<PostSummary>): PostSummary {
  return {
    id: Math.random().toString(36).slice(2),
    platformId: "FACEBOOK",
    text: "some post",
    status: "DRAFT",
    type: "TEXT_POST",
    duration: null,
    ratio: null,
    videoUrl: null,
    scheduledAt: null,
    publishedAt: null,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("computeQueueStats", () => {
  it("counts each status independently", () => {
    const posts = [
      post({ status: "SCHEDULED" }),
      post({ status: "SCHEDULED" }),
      post({ status: "PUBLISHED" }),
      post({ status: "DRAFT" }),
      post({ status: "FAILED" }),
    ];
    const stats = computeQueueStats(posts);
    expect(stats.scheduled).toBe(2);
    expect(stats.published).toBe(1);
    expect(stats.drafts).toBe(1);
  });

  it("picks the first scheduled post as next, respecting input order", () => {
    const first = post({ id: "first", status: "SCHEDULED" });
    const second = post({ id: "second", status: "SCHEDULED" });
    const stats = computeQueueStats([first, second]);
    expect(stats.next?.id).toBe("first");
  });

  it("next is undefined when nothing is scheduled", () => {
    const stats = computeQueueStats([post({ status: "DRAFT" }), post({ status: "PUBLISHED" })]);
    expect(stats.next).toBeUndefined();
  });

  it("handles an empty queue", () => {
    const stats = computeQueueStats([]);
    expect(stats).toEqual({ scheduled: 0, published: 0, drafts: 0, next: undefined });
  });
});
