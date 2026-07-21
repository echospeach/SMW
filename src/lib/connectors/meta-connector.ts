import { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { publishToPage, publishVideoToPage } from "./meta";
import type { PlatformConnector, PublishInput, PublishResult } from "./types";

// Unlike MockConnector, real connect/disconnect happens through the OAuth
// round trip (see src/app/api/accounts/facebook/{authorize,callback}) rather
// than these interface methods -- the Accounts UI redirects there directly
// instead of calling POST /api/accounts/facebook.
export class MetaGraphConnector implements PlatformConnector {
  readonly platformId = PlatformId.FACEBOOK;

  async connect(): Promise<{ handle: string }> {
    throw new Error("Facebook must be connected via OAuth: /api/accounts/facebook/authorize");
  }

  async disconnect(userId: string): Promise<void> {
    // Best-effort local disconnect; the Page access token isn't explicitly
    // revoked with Meta, but clearing it here means we stop using it.
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
      throw new Error("Facebook is not connected");
    }

    const externalPostId =
      input.type === "VIDEO" && input.videoUrl
        ? await publishVideoToPage(connection.externalId, connection.accessToken, input.videoUrl, input.text)
        : await publishToPage(connection.externalId, connection.accessToken, input.text);

    return { externalPostId, publishedAt: new Date() };
  }

  async checkStatus(): Promise<"published"> {
    return "published";
  }
}
