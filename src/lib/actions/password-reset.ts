"use server";

import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { RequestResetSchema, ResetPasswordSchema } from "@/lib/validation/auth";
import { checkAuthRateLimit, recordAuthAttempt } from "@/lib/rate-limit";

export type ResetFormState = { error?: string; success?: boolean } | undefined;

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(
  _prevState: ResetFormState,
  formData: FormData,
): Promise<ResetFormState> {
  const parsed = RequestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { email } = parsed.data;

  const { allowed } = await checkAuthRateLimit("password_reset_request", email);
  if (!allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }
  await recordAuthAttempt("password_reset_request", false, email);

  // Always the same response whether or not the account exists -- never
  // reveal account existence through this form.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return { success: true };
}

export async function resetPassword(
  _prevState: ResetFormState,
  formData: FormData,
): Promise<ResetFormState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hash(password, 12);

  // Guard against a race between two redemption attempts of the same token:
  // scope the update to usedAt: null so only the first one can succeed.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: resetToken.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  return { success: true };
}
