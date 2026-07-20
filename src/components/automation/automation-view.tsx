"use client";

import { useState, useTransition } from "react";
import { PlusCircle, ToggleLeft, ToggleRight, Trash2, TrendingUp, Zap } from "lucide-react";
import type { PlatformId } from "@/generated/prisma/enums";
import { PLATFORMS, C } from "@/lib/theme";
import { PlatformBadge } from "@/components/ui/platform-badge";

export type AutomationState = Record<PlatformId, { enabled: boolean; times: string[] }>;

export function AutomationView({
  connectedPlatforms,
  initialAutomation,
  initialAutoTrending,
}: {
  connectedPlatforms: PlatformId[];
  initialAutomation: AutomationState;
  initialAutoTrending: boolean;
}) {
  const [automation, setAutomation] = useState(initialAutomation);
  const [autoTrending, setAutoTrending] = useState(initialAutoTrending);
  const [, startTransition] = useTransition();

  const activePlatforms = PLATFORMS.filter((p) => connectedPlatforms.includes(p.id));
  const totalPerDay = activePlatforms.reduce(
    (sum, p) => sum + (automation[p.id].enabled ? automation[p.id].times.length : 0),
    0,
  );
  const activeCount = activePlatforms.filter((p) => automation[p.id].enabled).length;

  function patchRule(
    platformId: PlatformId,
    patch: Partial<{ enabled: boolean; times: string[] }>,
  ) {
    startTransition(async () => {
      await fetch(`/api/automation/${platformId.toLowerCase()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    });
  }

  function toggle(platformId: PlatformId) {
    const next = !automation[platformId].enabled;
    setAutomation((prev) => ({ ...prev, [platformId]: { ...prev[platformId], enabled: next } }));
    patchRule(platformId, { enabled: next });
  }

  function addTime(platformId: PlatformId) {
    const times = [...automation[platformId].times, "12:00"];
    setAutomation((prev) => ({ ...prev, [platformId]: { ...prev[platformId], times } }));
    patchRule(platformId, { times });
  }

  function updateTime(platformId: PlatformId, idx: number, value: string) {
    const times = [...automation[platformId].times];
    times[idx] = value;
    setAutomation((prev) => ({ ...prev, [platformId]: { ...prev[platformId], times } }));
    patchRule(platformId, { times });
  }

  function removeTime(platformId: PlatformId, idx: number) {
    const times = automation[platformId].times.filter((_, i) => i !== idx);
    setAutomation((prev) => ({ ...prev, [platformId]: { ...prev[platformId], times } }));
    patchRule(platformId, { times });
  }

  function toggleAutoTrending() {
    const next = !autoTrending;
    setAutoTrending(next);
    startTransition(async () => {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoTrending: next }),
      });
    });
  }

  return (
    <div className="space-y-5">
      <div
        className="flex items-center gap-4 rounded-xl p-4"
        style={{ background: C.raised, border: `1px solid ${C.line}` }}
      >
        <Zap size={20} color={C.amber} className="shrink-0" />
        <div>
          <div className="text-sm font-medium" style={{ color: C.paper }}>
            Posting {totalPerDay}x a day across {activeCount} account{activeCount !== 1 ? "s" : ""}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
            At each slot below, SMW pulls the next approved draft from the content pipeline and
            publishes it automatically. No draft ready → the slot is skipped, not filled with junk.
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-4 rounded-xl p-4"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <TrendingUp size={20} color={autoTrending ? C.amber : C.muted} className="shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: C.paper }}>
            Blend trending topics automatically
          </div>
          <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
            When a slot generates its own content, SMW checks what&apos;s trending in your niche and
            works it into the brief where it fits — never forced, never off-topic.
          </div>
        </div>
        <button
          onClick={toggleAutoTrending}
          className="shrink-0"
          style={{ color: autoTrending ? C.green : C.muted }}
        >
          {autoTrending ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
        </button>
      </div>

      {activePlatforms.length === 0 && (
        <div className="py-10 text-center text-sm" style={{ color: C.muted }}>
          Connect an account in Accounts to set up its posting rhythm.
        </div>
      )}

      {activePlatforms.map((p) => {
        const cfg = automation[p.id];
        return (
          <div
            key={p.id}
            className="rounded-xl p-4"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <div className="mb-3 flex items-center gap-3">
              <PlatformBadge id={p.id} size={16} />
              <span className="flex-1 text-sm font-medium" style={{ color: C.paper }}>
                {p.name}
              </span>
              <button
                onClick={() => toggle(p.id)}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: cfg.enabled ? C.green : C.muted }}
              >
                {cfg.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                {cfg.enabled ? "Auto-posting on" : "Paused"}
              </button>
            </div>

            {cfg.enabled && (
              <div className="space-y-2 pl-[30px]">
                <div className="flex flex-wrap gap-2">
                  {cfg.times.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 rounded-lg py-1 pr-1 pl-2"
                      style={{ background: C.raised, border: `1px solid ${C.line}` }}
                    >
                      <input
                        type="time"
                        value={t}
                        onChange={(e) => updateTime(p.id, idx, e.target.value)}
                        className="bg-transparent font-mono text-xs outline-none"
                        style={{ color: C.paper, colorScheme: "dark" }}
                      />
                      <button
                        onClick={() => removeTime(p.id, idx)}
                        className="rounded p-1"
                        style={{ color: C.muted }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addTime(p.id)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                    style={{ color: C.amber, border: `1px dashed ${C.amber}` }}
                  >
                    <PlusCircle size={13} /> Add time slot
                  </button>
                </div>
                <div className="font-mono text-[11px]" style={{ color: C.muted }}>
                  {cfg.times.length}x per day on {p.name}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
