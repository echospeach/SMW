import { z } from "zod";

export const CheckoutSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH", "SCALE"]),
  cycle: z.enum(["monthly", "yearly"]),
});
