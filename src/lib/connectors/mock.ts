import type { PlatformId } from "@/generated/prisma/enums";
import { getPlatformMeta } from "@/lib/theme";
import type { PlatformConnector, PublishInput, PublishResult } from "./types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simulates a real platform API: connect/disconnect are instant, publish has
// latency and a small random failure rate so the FAILED status path gets exercised.
export class MockConnector implements PlatformConnector {
  constructor(public readonly platformId: PlatformId) {}

  async connect(_userId: string): Promise<{ handle: string }> {
    return { handle: getPlatformMeta(this.platformId).handle };
  }

  async disconnect(_userId: string): Promise<void> {}

  async publish(_userId: string, _input: PublishInput): Promise<PublishResult> {
    await sleep(200 + Math.random() * 400);
    if (Math.random() < 0.03) {
      throw new Error(`Mock publish failure on ${this.platformId}`);
    }
    return { externalPostId: `mock_${crypto.randomUUID()}`, publishedAt: new Date() };
  }

  async checkStatus(): Promise<"published"> {
    return "published";
  }
}
