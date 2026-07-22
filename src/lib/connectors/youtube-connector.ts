import { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { refreshAccessToken, uploadVideo } from "./youtube";
import type { PlatformConnector, PublishInput, PublishResult } from "./types";

// Real connect/disconnect happens through the OAuth round trip (see
// src/app/api/accounts/youtube/{authorize,callback}) rather than these
// interface methods. Not yet surfaced in the Accounts UI until the Google
// Cloud OAuth consent screen passes verification for the upload scope.
export class YouTubeConnector implements PlatformConnector {
  readonly platformId = PlatformId.YOUTUBE;

  async connect(): Promise<{ handle: string }> {
    throw new Error("YouTube must be connected via OAuth: /api/accounts/youtube/authorize");
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

  private async getValidAccessToken(userId: string): Promise<string> {
    const connection = await prisma.socialConnection.findUnique({
      where: { userId_platformId: { userId, platformId: this.platformId } },
    });
    if (!connection?.connected || !connection.accessToken || !connection.refreshToken) {
      throw new Error("YouTube is not connected");
    }

    const expiringSoon =
      !connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000;
    if (!expiringSoon) return connection.accessToken;

    const refreshed = await refreshAccessToken(connection.refreshToken);
    await prisma.socialConnection.update({
      where: { userId_platformId: { userId, platformId: this.platformId } },
      data: {
        accessToken: refreshed.access_token,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
    return refreshed.access_token;
  }

  async publish(userId: string, input: PublishInput): Promise<PublishResult> {
    if (input.type !== "VIDEO" || !input.videoUrl) {
      throw new Error("YouTube only supports video posts");
    }

    const accessToken = await this.getValidAccessToken(userId);

    const videoRes = await fetch(input.videoUrl);
    if (!videoRes.ok) throw new Error("Failed to fetch rendered video for YouTube upload");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const title = input.text.slice(0, 100) || "New video";
    const externalPostId = await uploadVideo(accessToken, videoBuffer, title, input.text);

    return { externalPostId, publishedAt: new Date() };
  }

  async checkStatus(): Promise<"published"> {
    return "published";
  }
}
