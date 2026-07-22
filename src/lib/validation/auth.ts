import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }).trim(),
  ref: z.string().trim().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const RequestResetSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, { error: "Password must be at least 8 characters." }).trim(),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export const AdminLoginSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1).trim(),
});
