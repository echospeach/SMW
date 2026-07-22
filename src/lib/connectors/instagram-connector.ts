import { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { fetchInstagramMediaInsights, publishImageToInstagram } from "./meta";
import type { PlatformConnector, PostMetrics, PublishInput, PublishResult } from "./types";

// Real connect/disconnect happens through the OAuth round trip (see
// src/app/api/accounts/instagram/{authorize,callback}) rather than these
// interface methods -- the Accounts UI redirects there directly. Not yet
// surfaced in the Accounts UI (see accounts-view.tsx's AVAILABLE_PLATFORMS)
// until Meta business verification is cleared.
export class InstagramConnector implements PlatformConnector {
  readonly platformId = PlatformId.INSTAGRAM;

  async connect(): Promise<{ handle: string }> {
    throw new Error("Instagram must be connected via OAuth: /api/accounts/instagram/authorize");
  }

  async disconnect(userId: string): Promise<void> {
    await prisma.socialConnection.updateMany({
      where: { userId, platformId: this.platformId },
      data: { connected: false, handle: null, accessToken: null, externalId: null, connectedAt: null },
    });
  }

  async publish(userId: string, input: PublishInput): Promise<PublishResult> {
    const connection = await prisma.socialConnection.findUnique({
      where: { userId_platformId: { userId, platformId: this.platformId } },
    });
    if (!connection?.connected || !connection.accessToken || !connection.externalId) {
      throw new Error("Instagram is not connected");
    }
    // v1: Instagram publishing only supports an image post -- reels/video
    // and carousels need their own container flows, not built yet.
    if (!input.imageUrl) {
      throw new Error("Instagram publishing currently requires an image");
    }

    const externalPostId = await publishImageToInstagram(
      connection.externalId,
      connection.accessToken,
      input.imageUrl,
      input.text,
    );

    return { externalPostId, publishedAt: new Date() };
  }

  async checkStatus(): Promise<"published"> {
    return "published";
  }

  async fetchMetrics(userId: string, externalPostId: string): Promise<PostMetrics | null> {
    const connection = await prisma.socialConnection.findUnique({
      where: { userId_platformId: { userId, platformId: this.platformId } },
    });
    if (!connection?.connected || !connection.accessToken) return null;

    const insights = await fetchInstagramMediaInsights(externalPostId, connection.accessToken);
    if (!insights) return null;
    return { impressions: insights.impressions, likes: insights.likes, comments: insights.comments };
  }
}
