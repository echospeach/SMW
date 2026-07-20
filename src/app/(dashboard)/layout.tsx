import Link from "next/link";
import {
  LayoutDashboard,
  PenSquare,
  Zap,
  Users,
  CalendarDays,
  CreditCard,
  LogOut,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { C } from "@/lib/theme";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Content Studio", icon: PenSquare },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

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

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: C.muted }}
          >
            <Icon size={17} strokeWidth={2} />
            <span className="flex-1 text-left tracking-wide">{label}</span>
          </Link>
        ))}

        <div className="flex-1" />

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
