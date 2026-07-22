import { prisma } from "@/lib/prisma";
import { priceFor } from "@/lib/billing";
import { PLANS, C } from "@/lib/theme";
import { StatCard } from "@/components/ui/stat-card";
import { startOfMonth } from "@/lib/scheduling/engine";

const TOPUP_PRICE_USD = 5;

export default async function AdminRevenuePage() {
  const since = startOfMonth(new Date());

  const [groups, postsThisMonth, statusGroups, generationsThisMonth, creditGroups, topupCount] =
    await Promise.all([
      prisma.user.groupBy({
        by: ["plan", "billingCycle"],
        where: { subscriptionStatus: "active" },
        _count: true,
      }),
      prisma.post.count({ where: { publishedAt: { gte: since } } }),
      prisma.post.groupBy({ by: ["status"], _count: true }),
      prisma.videoRenderLog.count({ where: { createdAt: { gte: since } } }),
      prisma.referralCredit.groupBy({ by: ["reason"], _sum: { amount: true, consumed: true } }),
      prisma.referralCredit.count({ where: { reason: "paid_topup" } }),
    ]);

  const rows = groups.map((g) => {
    const plan = PLANS.find((p) => p.id === g.plan);
    const cycle = g.billingCycle === "yearly" ? "yearly" : "monthly";
    const amount = plan ? priceFor(plan, cycle).amount * g._count : 0;
    return { plan: plan?.name ?? g.plan, cycle, count: g._count, amount };
  });
  const mrr = rows.reduce((total, r) => total + r.amount, 0);

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Revenue & usage
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Business health, computed locally from plan pricing — no live Stripe calls.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <StatCard eyebrow="MRR" value={`$${mrr.toLocaleString()}`} sub="From active subscriptions" />
        <StatCard
          eyebrow="Top-up revenue"
          value={`$${(topupCount * TOPUP_PRICE_USD).toLocaleString()}`}
          sub={`${topupCount} purchases`}
        />
        <StatCard eyebrow="Posts published" value={postsThisMonth} sub="This month" />
        <StatCard eyebrow="AI generations" value={generationsThisMonth} sub="This month, all users" />
      </div>

      <div className="mt-6">
        <h2 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          By plan
        </h2>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr style={{ color: C.muted }}>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Plan</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Cycle</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">Subscribers</th>
              <th className="py-2 pr-3 font-mono uppercase tracking-wide">MRR contribution</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px dashed ${C.line}` }}>
                <td className="py-2 pr-3" style={{ color: C.paper }}>
                  {r.plan}
                </td>
                <td className="py-2 pr-3 capitalize" style={{ color: C.muted }}>
                  {r.cycle}
                </td>
                <td className="py-2 pr-3" style={{ color: C.muted }}>
                  {r.count}
                </td>
                <td className="py-2 pr-3" style={{ color: C.paper }}>
                  ${r.amount.toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center" style={{ color: C.muted }}>
                  No active subscriptions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
            Posts by status
          </h2>
          <div className="mt-2 space-y-1.5">
            {statusGroups.map((s) => (
              <div key={s.status} className="flex justify-between text-xs" style={{ color: C.paper }}>
                <span style={{ color: C.muted }}>{s.status}</span>
                <span>{s._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
            Credit ledger by reason
          </h2>
          <div className="mt-2 space-y-1.5">
            {creditGroups.map((c) => (
              <div key={c.reason} className="flex justify-between text-xs" style={{ color: C.paper }}>
                <span style={{ color: C.muted }}>{c.reason}</span>
                <span>
                  {c._sum.consumed ?? 0} / {c._sum.amount ?? 0} used
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
