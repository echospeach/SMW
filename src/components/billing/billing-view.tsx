"use client";

import { useState, useTransition } from "react";
import { Check, CreditCard, Star } from "lucide-react";
import { priceFor, type BillingCycle } from "@/lib/billing";
import { C, PLANS } from "@/lib/theme";

type Plan = (typeof PLANS)[number];
type Cycle = BillingCycle;

export function BillingView({
  currentPlan,
  currentCycle,
  hasActiveSubscription,
}: {
  currentPlan: Plan["id"];
  currentCycle: Cycle;
  hasActiveSubscription: boolean;
}) {
  const [cycle, setCycle] = useState<Cycle>(currentCycle);
  const [pendingPlan, setPendingPlan] = useState<Plan["id"] | null>(null);
  const [pendingPortal, setPendingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function goToCheckout(nextPlan: Plan["id"]) {
    setError(null);
    setPendingPlan(nextPlan);
    startTransition(async () => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan, cycle }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error ?? "Couldn't start checkout.");
      setPendingPlan(null);
    });
  }

  function goToPortal() {
    setError(null);
    setPendingPortal(true);
    startTransition(async () => {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error ?? "Couldn't open billing portal.");
      setPendingPortal(false);
    });
  }

  return (
    <div className="space-y-6">
      <div
        className="mx-auto flex w-fit items-center gap-1 rounded-full p-1"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium capitalize"
            style={{
              background: cycle === c ? C.amber : "transparent",
              color: cycle === c ? C.ink : C.muted,
            }}
          >
            {c}
            {c === "yearly" && (
              <span
                className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                style={{
                  background: cycle === c ? C.ink : C.raised,
                  color: cycle === c ? C.amber : C.green,
                }}
              >
                Save 20%
              </span>
            )}
          </button>
        ))}
      </div>

      {hasActiveSubscription && (
        <div
          className="mx-auto flex w-fit items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: C.raised, border: `1px solid ${C.line}` }}
        >
          <CreditCard size={16} color={C.amber} />
          <span className="text-xs" style={{ color: C.muted }}>
            Manage your payment method, invoices, or cancel anytime.
          </span>
          <button
            onClick={goToPortal}
            disabled={pendingPortal}
            className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60"
            style={{ background: C.amber, color: C.ink }}
          >
            {pendingPortal ? "Opening…" : "Manage billing"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-center text-xs" style={{ color: C.red }}>
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const price = priceFor(p, cycle);
          const isCurrent = hasActiveSubscription && currentPlan === p.id;
          const busy = isPending && pendingPlan === p.id;
          return (
            <div
              key={p.id}
              className="relative flex flex-col rounded-xl p-5"
              style={{ background: C.panel, border: `1px solid ${p.popular ? C.amber : C.line}` }}
            >
              {p.popular && (
                <span
                  className="absolute -top-2.5 left-5 flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px]"
                  style={{ background: C.amber, color: C.ink }}
                >
                  <Star size={10} fill={C.ink} /> Most popular
                </span>
              )}
              <div className="mt-1 text-sm font-bold" style={{ color: C.paper }}>
                {p.name}
              </div>
              <div className="mt-1 mb-4 text-xs" style={{ color: C.muted }}>
                {p.tagline}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: C.paper }}>
                  ${price.amount}
                </span>
                <span className="text-xs" style={{ color: C.muted }}>
                  {price.per}
                </span>
              </div>
              {price.note ? (
                <div className="mb-4 font-mono text-[11px]" style={{ color: C.muted }}>
                  {price.note}
                </div>
              ) : (
                <div className="mb-4" />
              )}

              <div className="mb-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: C.paper }}
                  >
                    <Check size={13} color={C.green} className="mt-0.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => (hasActiveSubscription ? goToPortal() : goToCheckout(p.id))}
                disabled={isCurrent || busy || pendingPortal}
                className="w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
                style={{
                  background: isCurrent ? "transparent" : p.popular ? C.amber : C.raised,
                  color: isCurrent ? C.muted : p.popular ? C.ink : C.paper,
                  border: `1px solid ${isCurrent ? C.line : p.popular ? C.amber : C.line}`,
                }}
              >
                {isCurrent
                  ? "Current plan"
                  : busy
                    ? "Redirecting…"
                    : hasActiveSubscription
                      ? `Switch to ${p.name}`
                      : `Subscribe to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center text-[11px]" style={{ color: C.muted }}>
        Payments and subscriptions are handled by Stripe (test mode).
      </div>
    </div>
  );
}
