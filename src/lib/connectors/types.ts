import type { ContentType, PlatformId, Ratio } from "@/generated/prisma/enums";

export type PublishInput = {
  text: string;
  type: ContentType;
  ratio?: Ratio | null;
  duration?: string | null;
};

export type PublishResult = {
  externalPostId: string;
  publishedAt: Date;
};

export type PublishStatus = "published" | "failed" | "pending";

export interface PlatformConnector {
  readonly platformId: PlatformId;
  connect(userId: string): Promise<{ handle: string }>;
  disconnect(userId: string): Promise<void>;
  publish(userId: string, input: PublishInput): Promise<PublishResult>;
  checkStatus(userId: string, externalPostId: string): Promise<PublishStatus>;
}
