import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PlatformId } from "@/generated/prisma/enums";
import { C } from "@/lib/theme";
import { AutomationView, type AutomationState } from "@/components/automation/automation-view";

export default async function AutomationPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const [rules, connections, settings] = await Promise.all([
    prisma.automationRule.findMany({ where: { userId } }),
    prisma.socialConnection.findMany({ where: { userId, connected: true } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const initialAutomation = Object.fromEntries(
    Object.values(PlatformId).map((id) => {
      const existing = rules.find((r) => r.platformId === id);
      return [id, { enabled: existing?.enabled ?? false, times: existing?.times ?? [] }];
    }),
  ) as AutomationState;

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Automation
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Set the rhythm — SMW keeps it running without you.
      </p>
      <div className="mt-6">
        <AutomationView
          connectedPlatforms={connections.map((c) => c.platformId)}
          initialAutomation={initialAutomation}
          initialAutoTrending={settings?.autoTrending ?? true}
        />
      </div>
    </div>
  );
}
