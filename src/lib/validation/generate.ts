import { z } from "zod";

export const GenerateRequestSchema = z.object({
  type: z.enum(["TEXT_POST", "IMAGE_POST", "CAROUSEL", "STORY", "VIDEO"]),
  topic: z.string().min(1),
  tone: z.enum(["CONFIDENT", "PLAYFUL", "INFORMATIVE"]),
  targetPlatforms: z.array(z.enum(["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TIKTOK", "YOUTUBE"])),
  selectedTrend: z
    .object({ label: z.string(), heat: z.string(), tag: z.string() })
    .nullable()
    .optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
