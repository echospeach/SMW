import { describe, expect, it } from "vitest";
import { isSlotDue, startOfDay } from "@/lib/scheduling/engine";

function at(hh: number, mm: number, ss = 0) {
  const d = new Date(2026, 0, 15, hh, mm, ss);
  return d;
}

describe("isSlotDue", () => {
  it("is true exactly at the slot time", () => {
    expect(isSlotDue("09:00", at(9, 0, 0))).toBe(true);
  });

  it("is true within the tolerance window", () => {
    expect(isSlotDue("09:00", at(9, 7, 30), 10)).toBe(true);
  });

  it("is false just before the slot time", () => {
    expect(isSlotDue("09:00", at(8, 59, 59))).toBe(false);
  });

  it("is false after the tolerance window elapses", () => {
    expect(isSlotDue("09:00", at(9, 11, 0), 10)).toBe(false);
  });

  it("respects a custom tolerance", () => {
    expect(isSlotDue("09:00", at(9, 4, 0), 3)).toBe(false);
    expect(isSlotDue("09:00", at(9, 2, 0), 3)).toBe(true);
  });

  it("rejects malformed slot strings instead of throwing", () => {
    expect(isSlotDue("25:00", at(9, 0))).toBe(false);
    expect(isSlotDue("9:00", at(9, 0))).toBe(false);
    expect(isSlotDue("not-a-time", at(9, 0))).toBe(false);
  });

  it("does not match a slot from the previous day just because tolerance underflows past midnight", () => {
    // 23:55 slot, now is 00:02 the next day — must not be treated as due.
    expect(isSlotDue("23:55", at(0, 2))).toBe(false);
  });
});

describe("startOfDay", () => {
  it("zeroes out the time component", () => {
    const d = startOfDay(at(14, 37, 22));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getDate()).toBe(15);
  });
});
