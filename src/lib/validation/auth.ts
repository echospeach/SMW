import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }).trim(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
