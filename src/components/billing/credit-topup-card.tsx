"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { C } from "@/lib/theme";

export function CreditTopupCard() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function buy() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/billing/topup", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error ?? "Couldn't start checkout.");
    });
  }

  return (
    <div
      className="mx-auto flex w-fit flex-col items-center gap-2 rounded-xl px-5 py-4 text-center"
      style={{ background: C.panel, border: `1px dashed ${C.line}` }}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: C.paper }}>
        <Sparkles size={14} color={C.amber} />
        Need more generations right now?
      </div>
      <p className="text-xs" style={{ color: C.muted }}>
        $5 for 10 extra AI generations — no subscription, use them anytime.
      </p>
      {error && (
        <p className="text-xs" style={{ color: C.red }}>
          {error}
        </p>
      )}
      <button
        onClick={buy}
        disabled={isPending}
        className="mt-1 rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-60"
        style={{ background: C.amber, color: C.ink }}
      >
        {isPending ? "Redirecting…" : "Buy 10 generations — $5"}
      </button>
    </div>
  );
}
