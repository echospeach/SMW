import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";
import { ContentStudio } from "@/components/studio/content-studio";

export default async function StudioPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const connections = await prisma.socialConnection.findMany({
    where: { userId, connected: true },
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Content Studio
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Brief it, generate it, schedule it.
      </p>
      <div className="mt-6">
        <ContentStudio connectedPlatforms={connections.map((c) => c.platformId)} />
      </div>
    </div>
  );
}
