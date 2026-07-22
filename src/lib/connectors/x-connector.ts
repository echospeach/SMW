import { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { postTweet, refreshAccessToken } from "./x";
import type { PlatformConnector, PublishInput, PublishResult } from "./types";

// Real connect/disconnect happens through the OAuth round trip (see
// src/app/api/accounts/x/{authorize,callback}) rather than these interface
// methods. Not yet surfaced in the Accounts UI until X's paid API tier
// (required for write access) is set up.
export class XConnector implements PlatformConnector {
  readonly platformId = PlatformId.X;

  async connect(): Promise<{ handle: string }> {
    throw new Error("X must be connected via OAuth: /api/accounts/x/authorize");
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
      throw new Error("X is not connected");
    }

    const expiringSoon =
      !connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000;
    if (!expiringSoon) return connection.accessToken;

    const refreshed = await refreshAccessToken(connection.refreshToken);
    await prisma.socialConnection.update({
      where: { userId_platformId: { userId, platformId: this.platformId } },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? connection.refreshToken,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
    return refreshed.access_token;
  }

  // v1: text-only, matching postTweet()'s current limitation.
  async publish(userId: string, input: PublishInput): Promise<PublishResult> {
    const accessToken = await this.getValidAccessToken(userId);
    const externalPostId = await postTweet(accessToken, input.text);
    return { externalPostId, publishedAt: new Date() };
  }

  async checkStatus(): Promise<"published"> {
    return "published";
  }
}
