import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PlatformId } from "@/generated/prisma/enums";
import { C } from "@/lib/theme";
import { AccountsView, type ConnectionState } from "@/components/accounts/accounts-view";

export default async function AccountsPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const connections = await prisma.socialConnection.findMany({ where: { userId } });
  const initial = Object.fromEntries(
    Object.values(PlatformId).map((id) => {
      const existing = connections.find((c) => c.platformId === id);
      return [id, { connected: existing?.connected ?? false, handle: existing?.handle ?? null }];
    }),
  ) as ConnectionState;

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Accounts
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Manage which accounts SMW can post to.
      </p>
      <div className="mt-6">
        <AccountsView initial={initial} />
      </div>
    </div>
  );
}
