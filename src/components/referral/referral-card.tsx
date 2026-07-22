"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift } from "lucide-react";
import { C } from "@/lib/theme";

type ReferralInfo = {
  inviteUrl: string;
  referredCount: number;
  bonusCreditsAvailable: number;
};

export function ReferralCard() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((res) => (res.ok ? res.json() : null))
      .then(setInfo)
      .catch(() => {});
  }, []);

  if (!info) return null;

  function copy() {
    if (!info) return;
    navigator.clipboard.writeText(info.inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-1.5 font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
        <Gift size={12} /> Invite friends
      </div>
      <p className="mt-1.5 text-xs" style={{ color: C.muted }}>
        Share your link — you and your friend each get bonus AI generations when they sign up.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={info.inviteUrl}
          className="min-w-0 flex-1 rounded-lg px-3 py-2 font-mono text-xs outline-none"
          style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
        />
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
          style={{ background: C.amber, color: C.ink }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2.5 text-[11px]" style={{ color: C.muted }}>
        {info.referredCount} friend{info.referredCount !== 1 ? "s" : ""} joined ·{" "}
        {info.bonusCreditsAvailable} bonus generation{info.bonusCreditsAvailable !== 1 ? "s" : ""}{" "}
        available
      </p>
    </div>
  );
}
