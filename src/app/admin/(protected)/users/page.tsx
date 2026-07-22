import { prisma } from "@/lib/prisma";
import { C, PLANS } from "@/lib/theme";
import { getAvailableBonusCredits } from "@/lib/referral";
import { setUserSuspended, setUserPlan, grantAdminCredits } from "@/lib/actions/admin";

function fmtDate(d: Date) {
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q ? { email: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      email: true,
      plan: true,
      billingCycle: true,
      subscriptionStatus: true,
      suspended: true,
      createdAt: true,
    },
  });

  const credits = await Promise.all(users.map((u) => getAvailableBonusCredits(u.id)));

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Users
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        {users.length} shown{q ? ` — matching "${q}"` : ""}.
      </p>

      <form className="mt-4 flex gap-2" action="/admin/users">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by email"
          className="w-64 rounded-lg px-3 py-2 text-sm outline-none placeholder:opacity-50"
          style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
        />
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-xs font-medium"
          style={{ background: C.amber, color: C.ink }}
        >
          Search
        </button>
      </form>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ color: C.muted }}>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Email</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Plan</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Status</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Credits</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Joined</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Suspend</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderTop: `1px dashed ${C.line}` }}>
                <td className="py-2 pr-3" style={{ color: C.paper }}>
                  {u.email}
                  {u.suspended && (
                    <span
                      className="ml-2 rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{ background: C.red, color: C.ink }}
                    >
                      SUSPENDED
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <form action={setUserPlan.bind(null, u.id)} className="flex gap-1">
                    <select
                      name="plan"
                      defaultValue={u.plan}
                      className="rounded px-1.5 py-1 text-[11px]"
                      style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
                    >
                      {PLANS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="billingCycle"
                      defaultValue={u.billingCycle}
                      className="rounded px-1.5 py-1 text-[11px]"
                      style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded px-1.5 py-1 text-[11px] font-medium"
                      style={{ background: C.raised, color: C.muted, border: `1px solid ${C.line}` }}
                    >
                      Set
                    </button>
                  </form>
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {u.subscriptionStatus ?? "—"}
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  <div className="flex items-center gap-1.5">
                    {credits[i]}
                    <form action={grantAdminCredits.bind(null, u.id)} className="flex gap-1">
                      <input
                        name="amount"
                        type="number"
                        min={1}
                        placeholder="+"
                        className="w-12 rounded px-1.5 py-1 text-[11px]"
                        style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
                      />
                      <button
                        type="submit"
                        className="rounded px-1.5 py-1 text-[11px] font-medium"
                        style={{ background: C.raised, color: C.muted, border: `1px solid ${C.line}` }}
                      >
                        Grant
                      </button>
                    </form>
                  </div>
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {fmtDate(u.createdAt)}
                </td>
                <td className="py-2 pr-3">
                  <form action={setUserSuspended.bind(null, u.id, !u.suspended)}>
                    <button
                      type="submit"
                      className="rounded px-2 py-1 text-[11px] font-medium"
                      style={{
                        background: u.suspended ? C.green : C.red,
                        color: C.ink,
                      }}
                    >
                      {u.suspended ? "Unsuspend" : "Suspend"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
