import type { PlanMeta } from "@/lib/theme";

export type BillingCycle = "monthly" | "yearly";

export type PriceInfo = {
  amount: number;
  per: "/mo";
  note: string | null;
};

export function priceFor(plan: PlanMeta, cycle: BillingCycle): PriceInfo {
  if (cycle === "monthly") return { amount: plan.monthly, per: "/mo", note: null };
  return {
    amount: Math.round(plan.yearly / 12),
    per: "/mo",
    note: `billed $${plan.yearly}/yr`,
  };
}
