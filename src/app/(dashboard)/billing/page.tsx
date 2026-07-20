import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { C } from "@/lib/theme";
import { BillingView } from "@/components/billing/billing-view";

export default async function BillingPage() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { plan: true, billingCycle: true, stripeSubscriptionId: true },
  });

  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Billing
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Pick the plan that matches how much you&apos;re posting.
      </p>
      <div className="mt-6">
        <BillingView
          currentPlan={user.plan}
          currentCycle={user.billingCycle === "yearly" ? "yearly" : "monthly"}
          hasActiveSubscription={user.stripeSubscriptionId != null}
        />
      </div>
    </div>
  );
}
