import { ContentType, PlatformId, Ratio } from "@/generated/prisma/enums";

// Design system colors, ported verbatim from the original prototype (smw-dashboard.jsx).
export const C = {
  ink: "#12151C",
  panel: "#1A1F29",
  raised: "#212836",
  paper: "#EDE9DD",
  muted: "#8890A0",
  amber: "#F2A93B",
  green: "#5FB88F",
  red: "#E2645A",
  line: "#2A303D",
} as const;

export type PlatformMeta = {
  id: PlatformId;
  name: string;
  dot: string;
  handle: string;
};

export const PLATFORMS: PlatformMeta[] = [
  { id: PlatformId.FACEBOOK, name: "Facebook", dot: "#4267B2", handle: "@smw.page" },
  { id: PlatformId.INSTAGRAM, name: "Instagram", dot: "#E1306C", handle: "@smw.ig" },
  { id: PlatformId.X, name: "X", dot: "#EDE9DD", handle: "@smw_hq" },
  { id: PlatformId.LINKEDIN, name: "LinkedIn", dot: "#0A66C2", handle: "SMW Inc." },
  { id: PlatformId.TIKTOK, name: "TikTok", dot: "#8890A0", handle: "@smw" },
  { id: PlatformId.YOUTUBE, name: "YouTube", dot: "#FF4B4B", handle: "SMW Channel" },
];

export function getPlatformMeta(id: PlatformId): PlatformMeta {
  const meta = PLATFORMS.find((p) => p.id === id);
  if (!meta) throw new Error(`Unknown platform id: ${id}`);
  return meta;
}

export const RATIOS: { id: Ratio; label: string; sub: string; ratio: string }[] = [
  { id: Ratio.PORTRAIT, label: "Portrait", sub: "9:16 · Reels & Stories", ratio: "9 / 16" },
  { id: Ratio.SQUARE, label: "Square", sub: "1:1 · Feed", ratio: "1 / 1" },
  { id: Ratio.LANDSCAPE, label: "Landscape", sub: "16:9 · Wide/YouTube", ratio: "16 / 9" },
];

export const DEFAULT_RATIO_BY_TYPE: Record<ContentType, Ratio | null> = {
  [ContentType.TEXT_POST]: null,
  [ContentType.IMAGE_POST]: Ratio.SQUARE,
  [ContentType.CAROUSEL]: Ratio.SQUARE,
  [ContentType.STORY]: Ratio.PORTRAIT,
  [ContentType.VIDEO]: Ratio.PORTRAIT,
};

export const STATUS_META = {
  PUBLISHED: { label: "Published", color: C.green },
  SCHEDULED: { label: "Scheduled", color: C.amber },
  DRAFT: { label: "Needs review", color: C.muted },
  FAILED: { label: "Failed", color: C.red },
} as const;

export type Trend = { label: string; heat: "high" | "medium" | "low"; tag: string };

export const TREND_POOL: Trend[] = [
  { label: "Sunday reset routines", heat: "high", tag: "lifestyle" },
  { label: "AI tools for small teams", heat: "high", tag: "tech" },
  { label: "Quiet luxury aesthetic", heat: "medium", tag: "style" },
  { label: "Local vs. big brand loyalty", heat: "medium", tag: "business" },
  { label: "Behind-the-scenes content", heat: "high", tag: "format" },
  { label: "Cost-of-living hacks", heat: "medium", tag: "finance" },
  { label: "Founder story reels", heat: "high", tag: "format" },
  { label: "Slow mornings, fast wins", heat: "low", tag: "lifestyle" },
  { label: "Product restock countdowns", heat: "medium", tag: "commerce" },
  { label: "Real talk about burnout", heat: "high", tag: "wellness" },
];

export function pickTrends(n = 5): Trend[] {
  return [...TREND_POOL].sort(() => Math.random() - 0.5).slice(0, n);
}
