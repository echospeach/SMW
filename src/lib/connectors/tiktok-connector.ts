import { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { fetchVideoMetrics, publishVideo, refreshAccessToken, resolvePublishedVideoId } from "./tiktok";
import type { PlatformConnector, PostMetrics, PublishInput, PublishResult } from "./types";

// Real connect/disconnect happens through the OAuth round trip (see
// src/app/api/accounts/tiktok/{authorize,callback}) rather than these
// interface methods -- the Accounts UI redirects there directly.
export class TikTokConnector implements PlatformConnector {
  readonly platformId = PlatformId.TIKTOK;

  async connect(): Promise<{ handle: string }> {
    throw new Error("TikTok must be connected via OAuth: /api/accounts/tiktok/authorize");
  }

  async disconnect(userId: string): Promise<void> {
    await prisma.socialConnection.updateMany({
      where: { userId, platformId: this.platformId },
      data: {
        connected: false,
        handle: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        externalId: null,
        connectedAt: null,
      },
    });
  }

  // TikTok access tokens expire in ~24h, much shorter than Facebook's Page
  // tokens -- refresh proactively whenever it's expiring soon.
  private async getValidAccessToken(userId: string): Promise<string> {
    const connection = await prisma.socialConnection.findUnique({
      where: { userId_platformId: { userId, platformId: this.platformId } },
    });
    if (!connection?.connected || !connection.accessToken || !connection.refreshToken) {
      throw new Error("TikTok is not connected");
    }

    const expiringSoon =
      !connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000;
    if (!expiringSoon) return connection.accessToken;

    const refreshed = await refreshAccessToken(connection.refreshToken);
    await prisma.socialConnection.update({
      where: { userId_platformId: { userId, platformId: this.platformId } },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
    return refreshed.access_token;
  }

  async publish(userId: string, input: PublishInput): Promise<PublishResult> {
    if (input.type !== "VIDEO" || !input.videoUrl) {
      throw new Error("TikTok only supports video posts");
    }

    const accessToken = await this.getValidAccessToken(userId);

    const videoRes = await fetch(input.videoUrl);
    if (!videoRes.ok) throw new Error("Failed to fetch rendered video for TikTok upload");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const publishId = await publishVideo(accessToken, videoBuffer, input.text);

    return { externalPostId: publishId, publishedAt: new Date() };
  }

  async checkStatus(): Promise<"published"> {
    return "published";
  }

  // externalPostId is the publish_id returned by publish(), not TikTok's
  // final video ID -- resolve it first via the publish-status endpoint.
  // Returns null (not an error) while moderation is still pending.
  async fetchMetrics(userId: string, externalPostId: string): Promise<PostMetrics | null> {
    const accessToken = await this.getValidAccessToken(userId);
    const videoId = await resolvePublishedVideoId(accessToken, externalPostId);
    if (!videoId) return null;

    const metrics = await fetchVideoMetrics(accessToken, videoId);
    if (!metrics) return null;
    return {
      likes: metrics.like_count,
      comments: metrics.comment_count,
      shares: metrics.share_count,
      views: metrics.view_count,
    };
  }
}
