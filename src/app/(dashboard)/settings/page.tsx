import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";
import { SettingsView } from "@/components/settings/settings-view";
import { ReferralCard } from "@/components/referral/referral-card";

export default async function SettingsPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Settings
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Notifications and how SMW writes for you.
      </p>
      <div className="mt-6 max-w-xl space-y-5">
        <ReferralCard />
        <SettingsView
          initial={{
            notifyOnPublish: settings?.notifyOnPublish ?? true,
            notifyOnFailure: settings?.notifyOnFailure ?? true,
            notifyWeeklyRecap: settings?.notifyWeeklyRecap ?? true,
          }}
          initialBrandVoice={{
            brandIndustry: settings?.brandIndustry ?? "",
            brandToneDescription: settings?.brandToneDescription ?? "",
            brandExamplePosts: settings?.brandExamplePosts ?? [],
          }}
          initialAvatar={{
            heygenAvatarId: settings?.heygenAvatarId ?? "",
            heygenVoiceId: settings?.heygenVoiceId ?? "",
          }}
        />
      </div>
    </div>
  );
}
