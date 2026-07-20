import { z } from "zod";

export const PlatformIdParam = z.enum([
  "FACEBOOK",
  "INSTAGRAM",
  "X",
  "LINKEDIN",
  "TIKTOK",
  "YOUTUBE",
]);
