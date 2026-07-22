"use client";

import { useState, useTransition } from "react";
import { Bell, Check, Feather, LifeBuoy, ToggleLeft, ToggleRight } from "lucide-react";
import { C, SUPPORT_EMAIL } from "@/lib/theme";

type NotificationSettings = {
  notifyOnPublish: boolean;
  notifyOnFailure: boolean;
  notifyWeeklyRecap: boolean;
};

type BrandVoiceSettings = {
  brandIndustry: string;
  brandToneDescription: string;
  brandExamplePosts: string[];
};

const TOGGLES: { key: keyof NotificationSettings; label: string; sub: string }[] = [
  {
    key: "notifyOnPublish",
    label: "Email me when a post publishes",
    sub: "A quick confirmation the moment a scheduled or automated post goes live.",
  },
  {
    key: "notifyOnFailure",
    label: "Email me when a post fails",
    sub: "So a broken connection or API error never goes unnoticed.",
  },
  {
    key: "notifyWeeklyRecap",
    label: "Weekly recap email",
    sub: "A Monday summary of what published, what's queued, and your top performer.",
  },
];

export function SettingsView({
  initial,
  initialBrandVoice,
}: {
  initial: NotificationSettings;
  initialBrandVoice: BrandVoiceSettings;
}) {
  const [settings, setSettings] = useState(initial);
  const [, startTransition] = useTransition();

  const [industry, setIndustry] = useState(initialBrandVoice.brandIndustry);
  const [tone, setTone] = useState(initialBrandVoice.brandToneDescription);
  const [examples, setExamples] = useState(initialBrandVoice.brandExamplePosts.join("\n\n"));
  const [savingVoice, setSavingVoice] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  function toggle(key: keyof NotificationSettings) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    startTransition(async () => {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
    });
  }

  async function saveBrandVoice() {
    setSavingVoice(true);
    setVoiceSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandIndustry: industry,
          brandToneDescription: tone,
          brandExamplePosts: examples
            .split("\n\n")
            .map((p) => p.trim())
            .filter(Boolean),
        }),
      });
      setVoiceSaved(true);
      setTimeout(() => setVoiceSaved(false), 2000);
    } finally {
      setSavingVoice(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-1.5 font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          <Bell size={12} /> Notifications
        </h2>
        <div className="mt-3 space-y-2">
          {TOGGLES.map((t) => (
            <div
              key={t.key}
              className="flex items-center gap-4 rounded-xl p-4"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: C.paper }}>
                  {t.label}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
                  {t.sub}
                </div>
              </div>
              <button
                onClick={() => toggle(t.key)}
                className="shrink-0"
                style={{ color: settings[t.key] ? C.green : C.muted }}
              >
                {settings[t.key] ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="flex items-center gap-1.5 font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          <Feather size={12} /> Brand voice
        </h2>
        <p className="mt-1.5 text-xs" style={{ color: C.muted }}>
          Tell SMW how your brand sounds — it&apos;ll shape every caption and script Content
          Studio generates for you.
        </p>
        <div className="mt-3 space-y-3 rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div>
            <label className="text-xs" style={{ color: C.muted }}>
              Industry
            </label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. specialty coffee roaster"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none placeholder:opacity-50"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.muted }}>
              Describe your tone
            </label>
            <textarea
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              rows={3}
              placeholder="e.g. warm and a little cheeky, never corporate, short sentences"
              className="mt-1 w-full resize-none rounded-lg px-3 py-2 text-sm outline-none placeholder:opacity-50"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.muted }}>
              Example posts (paste a few, separated by a blank line)
            </label>
            <textarea
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              rows={5}
              placeholder={"Monday means one thing here: fresh roast day.\n\nWe don't do fancy. We do good coffee, made right."}
              className="mt-1 w-full resize-none rounded-lg px-3 py-2 font-mono text-xs outline-none placeholder:opacity-50"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
          </div>
          <button
            onClick={saveBrandVoice}
            disabled={savingVoice}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-40"
            style={{ background: C.amber, color: C.ink }}
          >
            {voiceSaved ? <Check size={13} /> : null}
            {savingVoice ? "Saving…" : voiceSaved ? "Saved" : "Save brand voice"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="flex items-center gap-1.5 font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          <LifeBuoy size={12} /> Support
        </h2>
        <div className="mt-3 rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <p className="text-sm" style={{ color: C.paper }}>
            Questions or issues? We&apos;re happy to help.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-1 inline-block text-sm underline"
            style={{ color: C.amber }}
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
