import type Stripe from "stripe";
import type { BillingCycle } from "@/lib/billing";
import type { Plan } from "@/generated/prisma/enums";

// Stable identifiers used on both the Stripe Product/Price objects (scripts/setup-stripe.ts)
// and at runtime (checkout/webhook routes) — avoids hardcoding Stripe price IDs in env vars.
export const STRIPE_PRODUCT_ID: Record<Plan, string> = {
  STARTER: "smw_starter",
  GROWTH: "smw_growth",
  SCALE: "smw_scale",
};

export function priceLookupKey(plan: Plan, cycle: BillingCycle): string {
  return `smw_${plan.toLowerCase()}_${cycle}`;
}

const PRODUCT_TO_PLAN: Record<string, Plan> = Object.fromEntries(
  Object.entries(STRIPE_PRODUCT_ID).map(([plan, productId]) => [productId, plan as Plan]),
);

export function planForProductId(productId: string): Plan | null {
  return PRODUCT_TO_PLAN[productId] ?? null;
}

export function cycleFromPrice(price: Stripe.Price | null | undefined): BillingCycle {
  return price?.recurring?.interval === "year" ? "yearly" : "monthly";
}

export function planFromSubscription(subscription: Stripe.Subscription): {
  plan: Plan | null;
  cycle: BillingCycle;
} {
  const price = subscription.items.data[0]?.price;
  const productId = typeof price?.product === "string" ? price.product : price?.product?.id;
  const plan = productId ? planForProductId(productId) : null;
  return { plan, cycle: cycleFromPrice(price) };
}
