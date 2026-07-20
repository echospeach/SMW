import { z } from "zod";

const TimeSlot = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Expected HH:mm" });

export const AutomationPatchSchema = z.object({
  enabled: z.boolean().optional(),
  times: z.array(TimeSlot).optional(),
});
