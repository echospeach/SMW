import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  cycleFromPrice,
  planForProductId,
  planFromSubscription,
  priceLookupKey,
  STRIPE_PRODUCT_ID,
} from "@/lib/stripe/plans";

function fakePrice(overrides: Partial<Stripe.Price> = {}): Stripe.Price {
  return {
    id: "price_x",
    product: STRIPE_PRODUCT_ID.GROWTH,
    recurring: { interval: "month" } as Stripe.Price.Recurring,
    ...overrides,
  } as Stripe.Price;
}

function fakeSubscription(price: Stripe.Price): Stripe.Subscription {
  return {
    id: "sub_x",
    items: { data: [{ price }] },
  } as unknown as Stripe.Subscription;
}

describe("priceLookupKey", () => {
  it("builds a stable, predictable key", () => {
    expect(priceLookupKey("STARTER", "monthly")).toBe("smw_starter_monthly");
    expect(priceLookupKey("GROWTH", "yearly")).toBe("smw_growth_yearly");
    expect(priceLookupKey("SCALE", "monthly")).toBe("smw_scale_monthly");
  });
});

describe("planForProductId", () => {
  it("maps every known Stripe product id back to its plan", () => {
    for (const [plan, productId] of Object.entries(STRIPE_PRODUCT_ID)) {
      expect(planForProductId(productId)).toBe(plan);
    }
  });

  it("returns null for an unknown product id", () => {
    expect(planForProductId("prod_unrelated")).toBeNull();
  });
});

describe("cycleFromPrice", () => {
  it("returns yearly for a year-interval price", () => {
    expect(
      cycleFromPrice(fakePrice({ recurring: { interval: "year" } as Stripe.Price.Recurring })),
    ).toBe("yearly");
  });

  it("returns monthly for a month-interval price", () => {
    expect(cycleFromPrice(fakePrice())).toBe("monthly");
  });

  it("defaults to monthly for a missing or non-recurring price", () => {
    expect(cycleFromPrice(null)).toBe("monthly");
    expect(cycleFromPrice(undefined)).toBe("monthly");
    expect(cycleFromPrice(fakePrice({ recurring: null }))).toBe("monthly");
  });
});

describe("planFromSubscription", () => {
  it("resolves plan and cycle from the subscription's first item", () => {
    const sub = fakeSubscription(
      fakePrice({
        product: STRIPE_PRODUCT_ID.SCALE,
        recurring: { interval: "year" } as Stripe.Price.Recurring,
      }),
    );
    expect(planFromSubscription(sub)).toEqual({ plan: "SCALE", cycle: "yearly" });
  });

  it("handles an expanded product object (not just a string id)", () => {
    const sub = fakeSubscription(
      fakePrice({ product: { id: STRIPE_PRODUCT_ID.STARTER } as Stripe.Product }),
    );
    expect(planFromSubscription(sub)).toEqual({ plan: "STARTER", cycle: "monthly" });
  });

  it("returns a null plan when the product id is unrecognized", () => {
    const sub = fakeSubscription(fakePrice({ product: "prod_unrelated" }));
    expect(planFromSubscription(sub).plan).toBeNull();
  });
});
