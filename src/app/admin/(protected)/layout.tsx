import { redirect } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { requireAdminId } from "@/lib/admin-auth";
import { adminLogout } from "@/lib/actions/admin-auth";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { C } from "@/lib/theme";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminId = await requireAdminId();
  if (!adminId) redirect("/admin/login");

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ background: C.ink }}>
      <aside
        className="flex w-56 shrink-0 flex-col gap-1 p-4"
        style={{ borderRight: `1px solid ${C.line}` }}
      >
        <div className="mb-2 flex items-center gap-2 px-2 py-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: C.red, color: C.ink }}
          >
            <Shield size={15} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-widest" style={{ color: C.paper }}>
            SMW ADMIN
          </span>
        </div>

        <AdminSidebarNav />

        <div className="flex-1" />

        <div
          className="flex items-center justify-center rounded-lg px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase"
          style={{ background: C.raised, color: C.red }}
        >
          Admin mode
        </div>
        <form action={adminLogout}>
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

      <main className="max-w-5xl flex-1 p-6">{children}</main>
    </div>
  );
}
