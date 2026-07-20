import { z } from "zod";

export const RenderVideoSchema = z.object({
  script: z.string().min(1),
  ratio: z.enum(["PORTRAIT", "SQUARE", "LANDSCAPE"]).default("PORTRAIT"),
});
