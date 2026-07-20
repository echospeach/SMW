import { describe, expect, it } from "vitest";
import { priceFor } from "@/lib/billing";
import { PLANS } from "@/lib/theme";

const growth = PLANS.find((p) => p.id === "GROWTH")!;

describe("priceFor", () => {
  it("returns the flat monthly price with no note", () => {
    expect(priceFor(growth, "monthly")).toEqual({ amount: growth.monthly, per: "/mo", note: null });
  });

  it("returns yearly price divided into a monthly-equivalent, rounded, with a note", () => {
    const result = priceFor(growth, "yearly");
    expect(result.amount).toBe(Math.round(growth.yearly / 12));
    expect(result.note).toBe(`billed $${growth.yearly}/yr`);
  });

  it("yearly monthly-equivalent is cheaper than the flat monthly price", () => {
    for (const plan of PLANS) {
      const monthly = priceFor(plan, "monthly").amount;
      const yearlyEquivalent = priceFor(plan, "yearly").amount;
      expect(yearlyEquivalent).toBeLessThan(monthly);
    }
  });
});
