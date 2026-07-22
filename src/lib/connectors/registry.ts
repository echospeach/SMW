import { PlatformId } from "@/generated/prisma/enums";
import { MetaGraphConnector } from "./meta-connector";
import { TikTokConnector } from "./tiktok-connector";
import { InstagramConnector } from "./instagram-connector";
import { XConnector } from "./x-connector";
import { LinkedInConnector } from "./linkedin-connector";
import { YouTubeConnector } from "./youtube-connector";
import type { PlatformConnector } from "./types";

// Real integrations drop in one at a time by implementing PlatformConnector
// and swapping the entry here — nothing upstream (scheduling engine, API
// routes, UI) calls a connector class directly. All six platforms now have
// real connector code; Instagram/X/LinkedIn/YouTube stay invisible in the
// Accounts UI (see accounts-view.tsx's AVAILABLE_PLATFORMS/OAUTH_PLATFORMS)
// until their own verification/billing step is cleared, same as TikTok
// already is despite being fully real.
const registry: Record<PlatformId, PlatformConnector> = {
  FACEBOOK: new MetaGraphConnector(),
  INSTAGRAM: new InstagramConnector(),
  X: new XConnector(),
  LINKEDIN: new LinkedInConnector(),
  TIKTOK: new TikTokConnector(),
  YOUTUBE: new YouTubeConnector(),
};

export function getConnector(platformId: PlatformId): PlatformConnector {
  return registry[platformId];
}
