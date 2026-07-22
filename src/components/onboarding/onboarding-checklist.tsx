"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import { C } from "@/lib/theme";
import type { OnboardingStep } from "@/lib/onboarding";

const STEP_LINKS: Record<OnboardingStep["key"], string> = {
  connect_account: "/accounts",
  generate_content: "/studio",
  schedule_post: "/studio",
};

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: true }),
    });
  }

  return (
    <div className="relative rounded-xl p-4" style={{ background: C.raised, border: `1px solid ${C.line}` }}>
      <button
        onClick={dismiss}
        className="absolute top-3 right-3"
        style={{ color: C.muted }}
        aria-label="Dismiss checklist"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-1.5 font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.amber }}>
        <Sparkles size={12} /> Get started
      </div>
      <div className="mt-3 space-y-2">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={STEP_LINKS[step.key]}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm"
            style={{ background: step.done ? "transparent" : C.panel }}
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{
                background: step.done ? C.green : "transparent",
                border: step.done ? "none" : `1.5px solid ${C.muted}`,
              }}
            >
              {step.done && <Check size={12} color={C.ink} />}
            </span>
            <span style={{ color: step.done ? C.muted : C.paper, textDecoration: step.done ? "line-through" : "none" }}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
