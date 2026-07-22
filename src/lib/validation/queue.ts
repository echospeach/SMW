import { z } from "zod";
import { TrustedMediaUrlSchema } from "@/lib/validation/trusted-media-url";

const isoDate = z.string().refine((v) => !isNaN(Date.parse(v)), { error: "Invalid date" });

export const QueueCreateSchema = z.object({
  text: z.string().min(1),
  targets: z.array(z.enum(["FACEBOOK", "INSTAGRAM", "X", "LINKEDIN", "TIKTOK", "YOUTUBE"])).min(1),
  scheduledAt: isoDate.optional(),
  status: z.enum(["DRAFT", "SCHEDULED"]).default("SCHEDULED"),
  type: z.enum(["TEXT_POST", "IMAGE_POST", "CAROUSEL", "STORY", "VIDEO"]).default("TEXT_POST"),
  tone: z.enum(["CONFIDENT", "PLAYFUL", "INFORMATIVE"]).optional(),
  duration: z.string().optional(),
  ratio: z.enum(["PORTRAIT", "SQUARE", "LANDSCAPE"]).optional(),
  videoUrl: TrustedMediaUrlSchema.optional(),
  imageUrl: TrustedMediaUrlSchema.optional(),
  trendLabel: z.string().optional(),
});

export const QueuePatchSchema = z.object({
  text: z.string().min(1).optional(),
  scheduledAt: isoDate.optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).optional(),
});
