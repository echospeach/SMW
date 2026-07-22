"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/admin-auth";
import type { Plan } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

async function assertAdmin(): Promise<string> {
  const adminId = await requireAdminId();
  if (!adminId) throw new Error("Unauthorized");
  return adminId;
}

function logAudit(
  adminId: string,
  action: string,
  targetId?: string,
  detail?: Prisma.InputJsonValue,
) {
  return prisma.adminAuditLog.create({ data: { adminId, action, targetId, detail } });
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<void> {
  const adminId = await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { suspended } });
  await logAudit(adminId, suspended ? "suspend_user" : "unsuspend_user", userId);
  revalidatePath("/admin/users");
}

export async function setUserPlan(userId: string, formData: FormData): Promise<void> {
  const adminId = await assertAdmin();
  const plan = formData.get("plan") as Plan;
  const billingCycle = formData.get("billingCycle") as string;
  await prisma.user.update({ where: { id: userId }, data: { plan, billingCycle } });
  await logAudit(adminId, "set_plan", userId, { plan, billingCycle });
  revalidatePath("/admin/users");
}

// Grants into the same ledger as referral bonuses and paid top-ups -- picked
// up automatically by getAvailableBonusCredits()/consumeBonusCredit() with
// no changes needed anywhere else.
export async function grantAdminCredits(userId: string, formData: FormData): Promise<void> {
  const adminId = await assertAdmin();
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return;
  const floored = Math.floor(amount);
  await prisma.referralCredit.create({
    data: { userId, amount: floored, reason: "admin_grant" },
  });
  await logAudit(adminId, "grant_credits", userId, { amount: floored });
  revalidatePath("/admin/users");
}

export async function deletePost(postId: string): Promise<void> {
  const adminId = await assertAdmin();
  await prisma.post.delete({ where: { id: postId } });
  await logAudit(adminId, "delete_post", postId);
  revalidatePath("/admin/content");
}
