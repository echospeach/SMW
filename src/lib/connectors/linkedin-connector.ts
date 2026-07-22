import { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { createPost } from "./linkedin";
import type { PlatformConnector, PublishInput, PublishResult } from "./types";

// Real connect/disconnect happens through the OAuth round trip (see
// src/app/api/accounts/linkedin/{authorize,callback}) rather than these
// interface methods. Not yet surfaced in the Accounts UI until LinkedIn's
// Community Management API access is approved for this app.
export class LinkedInConnector implements PlatformConnector {
  readonly platformId = PlatformId.LINKEDIN;

  async connect(): Promise<{ handle: string }> {
    throw new Error("LinkedIn must be connected via OAuth: /api/accounts/linkedin/authorize");
  }

  async disconnect(userId: string): Promise<void> {
    await prisma.socialConnection.updateMany({
      where: { userId, platformId: this.platformId },
      data: { connected: false, handle: null, accessToken: null, externalId: null, connectedAt: null },
    });
  }

  // v1: text-only, posts to the member's personal feed (not a company page).
  async publish(userId: string, input: PublishInput): Promise<PublishResult> {
    const connection = await prisma.socialConnection.findUnique({
      where: { userId_platformId: { userId, platformId: this.platformId } },
    });
    if (!connection?.connected || !connection.accessToken || !connection.externalId) {
      throw new Error("LinkedIn is not connected");
    }

    const externalPostId = await createPost(connection.accessToken, connection.externalId, input.text);
    return { externalPostId, publishedAt: new Date() };
  }

  async checkStatus(): Promise<"published"> {
    return "published";
  }
}
