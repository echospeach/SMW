"use server";

import { hash } from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import { PlatformId } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { RegisterSchema } from "@/lib/validation/auth";
import { grantReferralBonuses } from "@/lib/referral";
import { checkAuthRateLimit, recordAuthAttempt } from "@/lib/rate-limit";

export type AuthFormState = { error?: string } | undefined;

// Sensible default posting rhythm pre-filled for a new user; automation stays off
// until they connect an account and opt in.
const DEFAULT_AUTOMATION_TIMES: Record<PlatformId, string[]> = {
  FACEBOOK: ["09:00", "13:30", "19:00"],
  INSTAGRAM: ["08:30", "17:00"],
  X: ["09:00", "12:00", "16:00"],
  LINKEDIN: ["10:00"],
  TIKTOK: ["18:00"],
  YOUTUBE: ["15:00"],
};

export async function register(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = RegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    ref: formData.get("ref") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { email, password, ref } = parsed.data;

  const { allowed } = await checkAuthRateLimit("register", email);
  if (!allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }
  await recordAuthAttempt("register", false, email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const referrer = ref ? await prisma.user.findUnique({ where: { referralCode: ref } }) : null;

  const passwordHash = await hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      referredByUserId: referrer?.id,
      settings: { create: { autoTrending: true } },
      connections: {
        create: Object.values(PlatformId).map((platformId) => ({
          platformId,
          connected: false,
        })),
      },
      automationRules: {
        create: Object.values(PlatformId).map((platformId) => ({
          platformId,
          enabled: false,
          times: DEFAULT_AUTOMATION_TIMES[platformId],
        })),
      },
    },
  });

  if (referrer) await grantReferralBonuses(referrer.id, newUser.id);

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get("email");
  const emailStr = typeof email === "string" ? email : undefined;

  const { allowed } = await checkAuthRateLimit("login", emailStr);
  if (!allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }
  // Recorded before the outcome is known -- signIn() redirects via a thrown
  // NEXT_REDIRECT on success, so there's no code path after it on success to
  // record from. The rate-limit check above only cares about attempt
  // frequency, not the eventual outcome, so this is recorded unconditionally.
  await recordAuthAttempt("login", false, emailStr);

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
