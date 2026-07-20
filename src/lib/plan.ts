import type { Plan } from "@/generated/prisma/enums";

// Matches the pricing copy in src/lib/theme.ts (PLANS): video is called out as
// "Video generation included" on Growth and "Priority video rendering" on
// Scale, but absent from Starter's feature list.
const VIDEO_ENABLED_PLANS: Plan[] = ["GROWTH", "SCALE"];

export function planIncludesVideo(plan: Plan): boolean {
  return VIDEO_ENABLED_PLANS.includes(plan);
}

// Bounds real AI spend (image + narration generation) regardless of how much
// a single subscriber renders. Well under subscription price at current
// per-video cost (roughly a few cents each) -- these are generous ceilings,
// not a tight quota.
const VIDEO_MONTHLY_LIMIT: Record<Plan, number> = {
  STARTER: 0,
  GROWTH: 30,
  SCALE: 150,
};

export function getVideoMonthlyLimit(plan: Plan): number {
  return VIDEO_MONTHLY_LIMIT[plan];
}
