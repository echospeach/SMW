import { prisma } from "@/lib/prisma";
import { priceFor } from "@/lib/billing";
import { PLANS, C } from "@/lib/theme";
import { StatCard } from "@/components/ui/stat-card";
import { startOfMonth } from "@/lib/scheduling/engine";

async function computeMrr(): Promise<number> {
  const groups = await prisma.user.groupBy({
    by: ["plan", "billingCycle"],
    where: { subscriptionStatus: "active" },
    _count: true,
  });
  let mrr = 0;
  for (const g of groups) {
    const plan = PLANS.find((p) => p.id === g.plan);
    if (!plan) continue;
    const cycle = g.billingCycle === "yearly" ? "yearly" : "monthly";
    mrr += priceFor(plan, cycle).amount * g._count;
  }
  return mrr;
}

export default async function AdminOverviewPage() {
  const since = startOfMonth(new Date());

  const [mrr, activeSubs, totalUsers, generationsThisMonth] = await Promise.all([
    computeMrr(),
    prisma.user.count({ where: { subscriptionStatus: "active" } }),
    prisma.user.count(),
    prisma.videoRenderLog.count({ where: { createdAt: { gte: since } } }),
  ]);

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Overview
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        The state of SMW at a glance.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <StatCard eyebrow="MRR" value={`$${mrr.toLocaleString()}`} sub="Active subscriptions" />
        <StatCard eyebrow="Active subscriptions" value={activeSubs} sub={`of ${totalUsers} total users`} />
        <StatCard eyebrow="Generations" value={generationsThisMonth} sub="This month, all users" />
      </div>
    </div>
  );
}
