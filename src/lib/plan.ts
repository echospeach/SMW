import type { Plan } from "@/generated/prisma/enums";

// Matches the pricing copy in src/lib/theme.ts (PLANS): video is called out as
// "Video generation included" on Growth and "Priority video rendering" on
// Scale, but absent from Starter's feature list.
const VIDEO_ENABLED_PLANS: Plan[] = ["GROWTH", "SCALE"];

export function planIncludesVideo(plan: Plan): boolean {
  return VIDEO_ENABLED_PLANS.includes(plan);
}
