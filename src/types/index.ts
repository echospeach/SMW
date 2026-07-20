import type { ContentType, PlatformId, PostStatus, Ratio } from "@/generated/prisma/enums";

export type PostSummary = {
  id: string;
  platformId: PlatformId;
  text: string;
  status: PostStatus;
  type: ContentType;
  duration: string | null;
  ratio: Ratio | null;
  videoUrl: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
};
