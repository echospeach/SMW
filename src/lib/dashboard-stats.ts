import type { PostSummary } from "@/types";

export type QueueStats = {
  scheduled: number;
  published: number;
  drafts: number;
  next: PostSummary | undefined;
};

export function computeQueueStats(posts: PostSummary[]): QueueStats {
  return {
    scheduled: posts.filter((p) => p.status === "SCHEDULED").length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    drafts: posts.filter((p) => p.status === "DRAFT").length,
    next: posts.find((p) => p.status === "SCHEDULED"),
  };
}
