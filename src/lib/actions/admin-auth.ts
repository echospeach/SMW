"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setAdminSessionCookie, clearAdminSessionCookie } from "@/lib/admin-auth";
import { AdminLoginSchema } from "@/lib/validation/auth";
import { checkAuthRateLimit, recordAuthAttempt } from "@/lib/rate-limit";

export type AdminAuthFormState = { error?: string } | undefined;

export async function adminLogin(
  _prevState: AdminAuthFormState,
  formData: FormData,
): Promise<AdminAuthFormState> {
  const parsed = AdminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { email, password } = parsed.data;

  const { allowed } = await checkAuthRateLimit("admin_login", email);
  if (!allowed) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }
  // Recorded before the outcome is known -- redirect() below throws to
  // navigate on success, so there's no code path after it to record from.
  await recordAuthAttempt("admin_login", false, email);

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    return { error: "Invalid email or password." };
  }
  const passwordMatches = await compare(password, admin.passwordHash);
  if (!passwordMatches) {
    return { error: "Invalid email or password." };
  }

  await setAdminSessionCookie(admin.id);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
