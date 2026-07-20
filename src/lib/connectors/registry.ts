import { PlatformId } from "@/generated/prisma/enums";
import { MockConnector } from "./mock";
import type { PlatformConnector } from "./types";

// Every entry is mocked today. A real integration (Meta Graph API, X API, ...)
// drops in later by implementing PlatformConnector and swapping the entry here —
// nothing upstream (scheduling engine, API routes, UI) calls a connector class directly.
const registry: Record<PlatformId, PlatformConnector> = {
  FACEBOOK: new MockConnector(PlatformId.FACEBOOK),
  INSTAGRAM: new MockConnector(PlatformId.INSTAGRAM),
  X: new MockConnector(PlatformId.X),
  LINKEDIN: new MockConnector(PlatformId.LINKEDIN),
  TIKTOK: new MockConnector(PlatformId.TIKTOK),
  YOUTUBE: new MockConnector(PlatformId.YOUTUBE),
};

export function getConnector(platformId: PlatformId): PlatformConnector {
  return registry[platformId];
}
