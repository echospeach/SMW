import { z } from "zod";

export const RenderAvatarVideoSchema = z.object({
  script: z.string().min(1),
});
