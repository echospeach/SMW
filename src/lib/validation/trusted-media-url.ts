import { z } from "zod";

// Every legitimate videoUrl/imageUrl on a Post is written server-side from a
// Vercel Blob upload (see generate/image, render-video, thumbnails/generate,
// render-avatar-video) -- the client never free-types one. Restricting to
// this host closes an SSRF path: without it, a client could set videoUrl to
// an internal/arbitrary address, which the TikTok/YouTube connectors later
// fetch() server-side when publishing.
const TRUSTED_MEDIA_HOST = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;

export const TrustedMediaUrlSchema = z.string().refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && TRUSTED_MEDIA_HOST.test(url.hostname);
    } catch {
      return false;
    }
  },
  { error: "Invalid media URL" },
);
