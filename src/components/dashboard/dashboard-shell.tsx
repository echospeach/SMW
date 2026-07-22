"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { C } from "@/lib/theme";
import { LogoMark } from "@/components/ui/logo-mark";

export function DashboardShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [renderedPathname, setRenderedPathname] = useState(pathname);

  // Close the drawer whenever the route changes -- the layout stays mounted
  // across navigations, so nothing else would reset this. Adjusting state
  // during render (rather than in an effect) avoids an extra committed frame
  // with the drawer still open.
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="flex min-h-screen w-full font-sans" style={{ background: C.ink }}>
      <div
        className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 px-4 py-3 md:hidden"
        style={{ background: C.ink, borderBottom: `1px solid ${C.line}` }}
      >
        <button onClick={() => setOpen(true)} aria-label="Open menu" style={{ color: C.paper }}>
          <Menu size={22} />
        </button>
        <LogoMark size={24} />
        <span className="text-sm font-bold tracking-widest" style={{ color: C.paper }}>
          SMW
        </span>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col gap-1 overflow-y-auto p-4 transition-transform duration-200 md:static md:z-auto md:w-56 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: C.ink, borderRight: `1px solid ${C.line}` }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="mb-2 self-end md:hidden"
          style={{ color: C.muted }}
        >
          <X size={20} />
        </button>
        {sidebar}
      </aside>

      <main className="w-full max-w-4xl flex-1 p-4 pt-20 md:p-6">{children}</main>
    </div>
  );
}
