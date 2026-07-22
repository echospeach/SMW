import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (!userId) return null;

  // Cuts off an already-logged-in suspended user on their next protected
  // page load, not just at their next login attempt (see src/lib/auth.ts).
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { suspended: true } });
  if (user?.suspended) return null;

  return userId;
}
