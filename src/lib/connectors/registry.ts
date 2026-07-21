import { PlatformId } from "@/generated/prisma/enums";
import { MockConnector } from "./mock";
import { MetaGraphConnector } from "./meta-connector";
import type { PlatformConnector } from "./types";

// Real integrations drop in one at a time by implementing PlatformConnector
// and swapping the entry here — nothing upstream (scheduling engine, API
// routes, UI) calls a connector class directly. Facebook is real (Meta Graph
// API); the rest are still mocked pending their own OAuth apps.
const registry: Record<PlatformId, PlatformConnector> = {
  FACEBOOK: new MetaGraphConnector(),
  INSTAGRAM: new MockConnector(PlatformId.INSTAGRAM),
  X: new MockConnector(PlatformId.X),
  LINKEDIN: new MockConnector(PlatformId.LINKEDIN),
  TIKTOK: new MockConnector(PlatformId.TIKTOK),
  YOUTUBE: new MockConnector(PlatformId.YOUTUBE),
};

export function getConnector(platformId: PlatformId): PlatformConnector {
  return registry[platformId];
}
