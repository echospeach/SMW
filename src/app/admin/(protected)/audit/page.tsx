import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";

function fmtTime(d: Date) {
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ACTION_LABEL: Record<string, string> = {
  suspend_user: "Suspended user",
  unsuspend_user: "Unsuspended user",
  set_plan: "Changed plan",
  grant_credits: "Granted credits",
  delete_post: "Deleted post",
};

export default async function AdminAuditPage() {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { admin: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Audit log
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Every admin action, most recent first.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ color: C.muted }}>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Admin</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Action</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Target</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Detail</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderTop: `1px dashed ${C.line}` }}>
                <td className="py-2 pr-3" style={{ color: C.paper }}>
                  {log.admin.email}
                </td>
                <td className="py-2 pr-3" style={{ color: C.amber }}>
                  {ACTION_LABEL[log.action] ?? log.action}
                </td>
                <td className="py-2 pr-3 font-mono text-[11px]" style={{ color: C.muted }}>
                  {log.targetId ?? "—"}
                </td>
                <td className="py-2 pr-3 font-mono text-[11px]" style={{ color: C.muted }}>
                  {log.detail ? JSON.stringify(log.detail) : "—"}
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {fmtTime(log.createdAt)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-center" style={{ color: C.muted }}>
                  No admin actions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
