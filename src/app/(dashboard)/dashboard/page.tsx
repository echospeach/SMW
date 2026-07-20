import Link from "next/link";
import { Plus, Radio } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PLATFORMS, C } from "@/lib/theme";
import { StatCard } from "@/components/ui/stat-card";
import { Ticket } from "@/components/ui/ticket";

function fmtDay(d: Date) {
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const [posts, connectedCount] = await Promise.all([
    prisma.post.findMany({
      where: { userId },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.socialConnection.count({ where: { userId, connected: true } }),
  ]);

  const scheduled = posts.filter((p) => p.status === "SCHEDULED").length;
  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const drafts = posts.filter((p) => p.status === "DRAFT").length;
  const next = posts.find((p) => p.status === "SCHEDULED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: C.paper }}>
          Dispatch
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
          Everything scheduled, published, or waiting on you.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard eyebrow="Scheduled" value={scheduled} sub="Queued to publish" />
        <StatCard eyebrow="Published" value={published} sub="Last 7 days" />
        <StatCard eyebrow="Awaiting review" value={drafts} sub="Sitting in drafts" />
        <StatCard
          eyebrow="Accounts live"
          value={`${connectedCount}/${PLATFORMS.length}`}
          sub="Connected & posting"
        />
      </div>

      {next?.scheduledAt && (
        <div
          className="flex items-center gap-4 rounded-xl p-4"
          style={{ background: C.raised, border: `1px solid ${C.line}` }}
        >
          <Radio size={18} color={C.amber} className="shrink-0" />
          <div className="flex-1">
            <div
              className="font-mono text-[10px] tracking-[0.15em] uppercase"
              style={{ color: C.amber }}
            >
              Next in queue
            </div>
            <div className="mt-0.5 text-sm" style={{ color: C.paper }}>
              {next.text}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-sm" style={{ color: C.paper }}>
              {fmtTime(next.scheduledAt)}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {fmtDay(next.scheduledAt)}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: C.green }}
            />
            <h2
              className="font-mono text-xs tracking-[0.15em] uppercase"
              style={{ color: C.muted }}
            >
              Live queue
            </h2>
          </div>
          <Link
            href="/studio"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: C.amber, color: C.ink }}
          >
            <Plus size={14} /> New content
          </Link>
        </div>
        <div className="space-y-2">
          {posts.length === 0 && (
            <p className="text-sm" style={{ color: C.muted }}>
              Nothing in the queue yet — head to Content Studio to draft your first post.
            </p>
          )}
          {posts.map((post) => (
            <Ticket key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
