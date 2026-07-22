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

// Separate, much smaller pool from VIDEO_MONTHLY_LIMIT -- HeyGen avatar
// videos cost roughly $1-4/minute (vs ~$0.05 for a regular AI video), so they
// get their own cap rather than sharing (or being subsidized by) the cheap
// pool. Same Growth+ eligibility as regular video (planIncludesVideo).
const AVATAR_MONTHLY_LIMIT: Record<Plan, number> = {
  STARTER: 0,
  GROWTH: 5,
  SCALE: 15,
};

export function getAvatarMonthlyLimit(plan: Plan): number {
  return AVATAR_MONTHLY_LIMIT[plan];
}
