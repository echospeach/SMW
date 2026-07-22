import { AlertTriangle, LifeBuoy, LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { requireUserId } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LogoMark } from "@/components/ui/logo-mark";
import { prisma } from "@/lib/prisma";
import { C, SUPPORT_EMAIL } from "@/lib/theme";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const [session, draftCount] = await Promise.all([
    auth(),
    prisma.post.count({ where: { userId, status: "DRAFT" } }),
  ]);

  return (
    <DashboardShell
      sidebar={
        <>
          <div className="mb-2 hidden items-center gap-2 px-2 py-3 md:flex">
            <LogoMark />
            <span className="text-sm font-bold tracking-widest" style={{ color: C.paper }}>
              SMW
            </span>
          </div>

          <SidebarNav />

          <div className="flex-1" />

          {draftCount > 0 && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
              style={{ background: C.raised, color: C.muted }}
            >
              <AlertTriangle size={13} color={C.amber} />
              {draftCount} draft{draftCount !== 1 ? "s" : ""} need review
            </div>
          )}

          <div
            className="rounded-lg px-3 py-2 text-[11px]"
            style={{ background: C.raised, color: C.muted }}
          >
            {session?.user?.email}
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px]"
            style={{ color: C.muted }}
          >
            <LifeBuoy size={12} />
            Support
          </a>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
              style={{ color: C.muted }}
            >
              <LogOut size={17} strokeWidth={2} />
              Log out
            </button>
          </form>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
