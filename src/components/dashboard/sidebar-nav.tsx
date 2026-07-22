"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  PenSquare,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { C } from "@/lib/theme";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Content Studio", icon: PenSquare },
  { href: "/thumbnails", label: "Thumbnails", icon: ImageIcon },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: active ? C.raised : "transparent",
              color: active ? C.paper : C.muted,
            }}
          >
            <Icon size={17} strokeWidth={2} />
            <span className="flex-1 text-left tracking-wide">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
