import { AlertTriangle, LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { requireUserId } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const [session, draftCount] = await Promise.all([
    auth(),
    prisma.post.count({ where: { userId, status: "DRAFT" } }),
  ]);

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ background: C.ink }}>
      <aside
        className="flex w-56 shrink-0 flex-col gap-1 p-4"
        style={{ borderRight: `1px solid ${C.line}` }}
      >
        <div className="mb-2 flex items-center gap-2 px-2 py-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold"
            style={{ background: C.amber, color: C.ink }}
          >
            S
          </div>
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
      </aside>

      <main className="max-w-4xl flex-1 p-6">{children}</main>
    </div>
  );
}
