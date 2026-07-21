import { z } from "zod";

export const ThumbnailGenerateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  ratio: z.enum(["PORTRAIT", "SQUARE", "LANDSCAPE"]).default("SQUARE"),
});
