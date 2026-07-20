import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { C, STATUS_META } from "@/lib/theme";
import { PlatformBadge } from "@/components/ui/platform-badge";

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default async function CalendarPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const posts = await prisma.post.findMany({
    where: { userId },
    orderBy: { scheduledAt: "asc" },
  });

  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return d;
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Calendar
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Your posting schedule across the next 7 days.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-2 md:grid-cols-7">
        {days.map((day, i) => {
          const items = posts.filter((p) => {
            const when = p.scheduledAt ?? p.publishedAt;
            return when && when.toDateString() === day.toDateString();
          });
          return (
            <div
              key={i}
              className="min-h-[120px] rounded-lg p-2.5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div
                className="mb-2 font-mono text-[10px] tracking-wide uppercase"
                style={{ color: i === 0 ? C.amber : C.muted }}
              >
                {i === 0 ? "Today" : day.toLocaleDateString([], { weekday: "short" })}
                <span className="block text-[9px] opacity-70">
                  {day.toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => {
                  const meta = STATUS_META[item.status];
                  const when = item.scheduledAt ?? item.publishedAt;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 rounded px-1.5 py-1"
                      style={{ background: C.raised }}
                    >
                      <PlatformBadge id={item.platformId} size={10} />
                      <span
                        className="flex-1 truncate font-mono text-[10px]"
                        style={{ color: meta.color }}
                      >
                        {when ? fmtTime(when) : "—"}
                      </span>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-[10px]" style={{ color: C.muted, opacity: 0.5 }}>
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
