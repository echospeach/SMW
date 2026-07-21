import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PlatformId } from "@/generated/prisma/enums";
import { C } from "@/lib/theme";
import { AccountsView, type ConnectionState } from "@/components/accounts/accounts-view";

const FACEBOOK_STATUS_MESSAGE: Record<string, { text: string; isError: boolean }> = {
  connected: { text: "Facebook Page connected.", isError: false },
  denied: { text: "Facebook connection was cancelled.", isError: true },
  invalid_state: { text: "Facebook connection expired — try again.", isError: true },
  no_pages: {
    text: "No Facebook Pages found for that account — you need to manage at least one Page.",
    isError: true,
  },
  error: { text: "Facebook connection failed. Try again.", isError: true },
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ facebook?: string }>;
}) {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const connections = await prisma.socialConnection.findMany({ where: { userId } });
  const initial = Object.fromEntries(
    Object.values(PlatformId).map((id) => {
      const existing = connections.find((c) => c.platformId === id);
      return [id, { connected: existing?.connected ?? false, handle: existing?.handle ?? null }];
    }),
  ) as ConnectionState;

  const { facebook } = await searchParams;
  const status = facebook ? FACEBOOK_STATUS_MESSAGE[facebook] : undefined;

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Accounts
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Manage which accounts SMW can post to.
      </p>
      {status && (
        <div
          className="mt-4 rounded-lg px-3.5 py-2.5 text-xs"
          style={{
            background: C.raised,
            border: `1px solid ${status.isError ? C.red : C.green}`,
            color: status.isError ? C.red : C.green,
          }}
        >
          {status.text}
        </div>
      )}
      <div className="mt-6">
        <AccountsView initial={initial} />
      </div>
    </div>
  );
}
