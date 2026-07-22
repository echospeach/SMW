import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";

const CRON_NAMES = ["publish", "metrics", "weekly-recap"] as const;

function fmtTime(d: Date) {
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminHealthPage() {
  const [latestRuns, recentRuns, recentFailedPosts] = await Promise.all([
    Promise.all(
      CRON_NAMES.map((name) =>
        prisma.cronRun.findFirst({ where: { name }, orderBy: { createdAt: "desc" } }),
      ),
    ),
    prisma.cronRun.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.post.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        System health
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Cron run history and recent failures.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {CRON_NAMES.map((name, i) => {
          const run = latestRuns[i];
          return (
            <div
              key={name}
              className="min-w-[160px] flex-1 rounded-xl p-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase" style={{ color: C.muted }}>
                {name}
              </div>
              <div
                className="mt-1.5 text-sm font-bold"
                style={{ color: !run ? C.muted : run.ok ? C.green : C.red }}
              >
                {!run ? "No runs yet" : run.ok ? "Healthy" : "Failing"}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
                {run ? fmtTime(run.createdAt) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <h2 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          Recent cron runs
        </h2>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr style={{ color: C.muted }}>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Name</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Time</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Result</th>
            </tr>
          </thead>
          <tbody>
            {recentRuns.map((r) => (
              <tr key={r.id} style={{ borderTop: `1px dashed ${C.line}` }}>
                <td className="py-2 pr-3" style={{ color: C.paper }}>
                  {r.name}
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {fmtTime(r.createdAt)}
                </td>
                <td className="py-2 pr-3" style={{ color: r.ok ? C.green : C.red }}>
                  {r.ok ? JSON.stringify(r.summary) : (r.error ?? "failed")}
                </td>
              </tr>
            ))}
            {recentRuns.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 text-center" style={{ color: C.muted }}>
                  No cron runs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h2 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          Recent failed posts
        </h2>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr style={{ color: C.muted }}>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">User</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Platform</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Reason</th>
            </tr>
          </thead>
          <tbody>
            {recentFailedPosts.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px dashed ${C.line}` }}>
                <td className="py-2 pr-3" style={{ color: C.paper }}>
                  {p.user.email}
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {p.platformId}
                </td>
                <td className="py-2 pr-3" style={{ color: C.red }}>
                  {p.failureReason ?? "—"}
                </td>
              </tr>
            ))}
            {recentFailedPosts.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 text-center" style={{ color: C.muted }}>
                  No failures recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
