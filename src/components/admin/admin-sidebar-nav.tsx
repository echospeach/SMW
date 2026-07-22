"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, LayoutDashboard, Users, Wallet } from "lucide-react";
import { C } from "@/lib/theme";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/revenue", label: "Revenue", icon: Wallet, exact: false },
  { href: "/admin/health", label: "Health", icon: Activity, exact: false },
  { href: "/admin/content", label: "Content", icon: FileText, exact: false },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
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
