"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/admin-auth";
import type { Plan } from "@/generated/prisma/enums";

async function assertAdmin(): Promise<void> {
  const adminId = await requireAdminId();
  if (!adminId) throw new Error("Unauthorized");
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<void> {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { suspended } });
  revalidatePath("/admin/users");
}

export async function setUserPlan(userId: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const plan = formData.get("plan") as Plan;
  const billingCycle = formData.get("billingCycle") as string;
  await prisma.user.update({ where: { id: userId }, data: { plan, billingCycle } });
  revalidatePath("/admin/users");
}

// Grants into the same ledger as referral bonuses and paid top-ups -- picked
// up automatically by getAvailableBonusCredits()/consumeBonusCredit() with
// no changes needed anywhere else.
export async function grantAdminCredits(userId: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return;
  await prisma.referralCredit.create({
    data: { userId, amount: Math.floor(amount), reason: "admin_grant" },
  });
  revalidatePath("/admin/users");
}

export async function deletePost(postId: string): Promise<void> {
  await assertAdmin();
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin/content");
}
