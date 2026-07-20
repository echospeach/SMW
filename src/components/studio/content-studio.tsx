"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Film,
  Flame,
  Image as ImageIcon,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import type { ContentType, PlatformId, Ratio, Tone } from "@/generated/prisma/enums";
import { C, DEFAULT_RATIO_BY_TYPE, PLATFORMS, RATIOS, type Trend } from "@/lib/theme";

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: "TEXT_POST", label: "Text post" },
  { id: "IMAGE_POST", label: "Image post" },
  { id: "CAROUSEL", label: "Carousel" },
  { id: "STORY", label: "Story" },
  { id: "VIDEO", label: "Video" },
];

const TONES: Tone[] = ["CONFIDENT", "PLAYFUL", "INFORMATIVE"];
const TONE_LABEL: Record<Tone, string> = {
  CONFIDENT: "Confident",
  PLAYFUL: "Playful",
  INFORMATIVE: "Informative",
};

export function ContentStudio({ connectedPlatforms }: { connectedPlatforms: PlatformId[] }) {
  const router = useRouter();
  const [type, setType] = useState<ContentType>("TEXT_POST");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("CONFIDENT");
  const [targets, setTargets] = useState<Set<PlatformId>>(new Set(connectedPlatforms.slice(0, 1)));
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");
  const [videoDuration, setVideoDuration] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [ratio, setRatio] = useState<Ratio | null>(DEFAULT_RATIO_BY_TYPE.TEXT_POST);
  const [ratioTouched, setRatioTouched] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [refreshingTrends, setRefreshingTrends] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isVideo = type === "VIDEO";
  const isVisual = type !== "TEXT_POST";
  const connectedMeta = PLATFORMS.filter((p) => connectedPlatforms.includes(p.id));

  useEffect(() => {
    refreshTrends();
  }, []);

  async function refreshTrends() {
    setRefreshingTrends(true);
    try {
      const res = await fetch("/api/trends");
      if (res.ok) {
        const { trends } = await res.json();
        setTrends(trends);
      }
    } finally {
      setRefreshingTrends(false);
    }
  }

  function toggleTrend(t: Trend) {
    setSelectedTrend((prev) => (prev?.label === t.label ? null : t));
  }

  function handleTypeChange(newType: ContentType) {
    setType(newType);
    if (!ratioTouched) setRatio(DEFAULT_RATIO_BY_TYPE[newType]);
  }

  function handleRatioChange(id: Ratio) {
    setRatio(id);
    setRatioTouched(true);
  }

  function toggleTarget(id: PlatformId) {
    setTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setDraft("");
    setVideoDuration(null);
    setVideoUrl(null);
    setRenderError(null);
    setGenerateError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          topic,
          tone,
          targetPlatforms: Array.from(targets),
          selectedTrend,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (isVideo) {
          setDraft(data.script);
          setVideoDuration(data.duration);
        } else {
          setDraft(data.draft);
        }
      } else {
        const data = await res.json().catch(() => null);
        setGenerateError(data?.error ?? "Couldn't generate a draft. Try again.");
      }
    } catch {
      setGenerateError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function renderVideo() {
    if (!draft.trim()) return;
    setRendering(true);
    setRenderError(null);
    setVideoUrl(null);
    try {
      const startRes = await fetch("/api/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: draft, ratio }),
      });
      if (!startRes.ok) {
        setRenderError("Couldn't start the render. Try again.");
        return;
      }
      const { jobId } = await startRes.json();

      for (let attempt = 0; attempt < 40; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusRes = await fetch(`/api/render-video/${jobId}`);
        if (!statusRes.ok) continue;
        const job = await statusRes.json();
        if (job.status === "done") {
          setVideoUrl(job.url);
          return;
        }
        if (job.status === "failed") {
          setRenderError("Render failed. Try again.");
          return;
        }
      }
      setRenderError("Render is taking longer than expected. Try again shortly.");
    } finally {
      setRendering(false);
    }
  }

  async function handleSchedule() {
    if (!draft.trim() || targets.size === 0 || !scheduleAt) return;
    setSubmitting(true);
    setScheduleError(null);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: draft,
          targets: Array.from(targets),
          scheduledAt: new Date(scheduleAt).toISOString(),
          status: "SCHEDULED",
          type,
          tone,
          duration: isVideo ? videoDuration : undefined,
          ratio: isVisual ? ratio : undefined,
          videoUrl: isVideo ? videoUrl : undefined,
          trendLabel: selectedTrend?.label,
        }),
      });
      if (res.ok) {
        setDraft("");
        setTopic("");
        setScheduleAt("");
        setVideoDuration(null);
        setVideoUrl(null);
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setScheduleError(data?.error ?? "Couldn't add this to the queue. Try again.");
      }
    } catch {
      setScheduleError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div
        className="space-y-4 rounded-xl p-5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <h3 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          Brief
        </h3>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Content type
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as ContentType)}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Topic
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. our new product launch"
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none placeholder:opacity-50"
            style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
              <TrendingUp size={12} /> Trending now
            </label>
            <button
              onClick={refreshTrends}
              className="flex items-center gap-1 text-[11px]"
              style={{ color: C.muted }}
            >
              <RefreshCw size={11} className={refreshingTrends ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {trends.map((t) => (
              <button
                key={t.label}
                onClick={() => toggleTrend(t)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px]"
                style={{
                  background: selectedTrend?.label === t.label ? C.amber : C.raised,
                  color: selectedTrend?.label === t.label ? C.ink : C.paper,
                  border: `1px solid ${selectedTrend?.label === t.label ? C.amber : C.line}`,
                }}
              >
                {t.heat === "high" && (
                  <Flame size={10} color={selectedTrend?.label === t.label ? C.ink : C.amber} />
                )}
                {t.label}
              </button>
            ))}
          </div>
          {selectedTrend && (
            <div className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
              Draft will lean into{" "}
              <span style={{ color: C.amber }}>&quot;{selectedTrend.label}&quot;</span> alongside
              your topic.
            </div>
          )}
        </div>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Tone
          </label>
          <div className="mt-1.5 flex gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className="rounded-full px-3 py-1.5 text-xs"
                style={{
                  background: tone === t ? C.amber : C.raised,
                  color: tone === t ? C.ink : C.muted,
                  border: `1px solid ${tone === t ? C.amber : C.line}`,
                }}
              >
                {TONE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {isVisual && (
          <div>
            <label className="text-xs" style={{ color: C.muted }}>
              Format
            </label>
            <div className="mt-1.5 flex gap-2">
              {RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRatioChange(r.id)}
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-lg py-2.5"
                  style={{
                    background: ratio === r.id ? C.raised : "transparent",
                    border: `1px solid ${ratio === r.id ? C.amber : C.line}`,
                  }}
                >
                  <span
                    className="block rounded-[2px]"
                    style={{
                      aspectRatio: r.ratio,
                      height: 22,
                      border: `1.5px solid ${ratio === r.id ? C.amber : C.muted}`,
                    }}
                  />
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: ratio === r.id ? C.paper : C.muted }}
                  >
                    {r.label}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: C.muted }}>
                    {r.sub.split(" · ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Post to
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {connectedMeta.length === 0 && (
              <span className="text-xs" style={{ color: C.muted }}>
                Connect an account first in Accounts.
              </span>
            )}
            {connectedMeta.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleTarget(p.id)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
                style={{
                  background: targets.has(p.id) ? C.raised : "transparent",
                  border: `1px solid ${targets.has(p.id) ? C.amber : C.line}`,
                  color: C.paper,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!topic.trim() || generating}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
          style={{ background: C.amber, color: C.ink }}
        >
          {generating ? (
            <Loader2 size={15} className="animate-spin" />
          ) : isVideo ? (
            <Video size={15} />
          ) : (
            <Sparkles size={15} />
          )}
          {generating
            ? isVideo
              ? "Rendering video…"
              : "Generating…"
            : isVideo
              ? "Generate video"
              : "Generate draft"}
        </button>
        {generateError && (
          <p className="text-[11px]" style={{ color: C.red }}>
            {generateError}
          </p>
        )}
      </div>

      <div
        className="space-y-4 rounded-xl p-5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <h3 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          {isVideo ? "Video" : "Draft"}
        </h3>
        {!draft && !generating && (
          <div
            className="flex h-32 items-center justify-center px-6 text-center text-xs"
            style={{ color: C.muted }}
          >
            {isVideo
              ? "Fill in a topic and generate a video — you'll get a script and a rendered preview to edit."
              : "Fill in a topic and generate a draft — it'll land here for you to edit before it goes anywhere."}
          </div>
        )}
        {generating && (
          <div
            className="flex h-32 items-center justify-center gap-2 text-xs"
            style={{ color: C.muted }}
          >
            <Loader2 size={14} className="animate-spin" />{" "}
            {isVideo ? "Rendering scenes…" : "Writing a draft…"}
          </div>
        )}
        {draft && !generating && (
          <>
            {isVideo && videoUrl && (
              <div
                className="relative mx-auto overflow-hidden rounded-lg"
                style={{
                  aspectRatio: RATIOS.find((r) => r.id === ratio)?.ratio,
                  height: 220,
                  border: `1px solid ${C.line}`,
                }}
              >
                <video
                  src={videoUrl}
                  controls
                  className="h-full w-full object-cover"
                  style={{ background: C.ink }}
                />
              </div>
            )}
            {isVisual && !(isVideo && videoUrl) && (
              <div
                className="relative mx-auto flex items-center justify-center overflow-hidden rounded-lg"
                style={{
                  aspectRatio: RATIOS.find((r) => r.id === ratio)?.ratio,
                  height: 220,
                  background: `linear-gradient(135deg, ${C.raised}, ${C.ink})`,
                  border: `1px solid ${C.line}`,
                }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: C.amber }}
                >
                  {isVideo ? (
                    <Play size={18} color={C.ink} fill={C.ink} />
                  ) : (
                    <ImageIcon size={18} color={C.ink} />
                  )}
                </span>
                {isVideo && (
                  <span
                    className="absolute right-2 bottom-2 rounded px-1.5 py-0.5 font-mono text-[10px]"
                    style={{ background: C.ink, color: C.paper }}
                  >
                    {videoDuration}
                  </span>
                )}
                <span
                  className="absolute top-2 left-2 flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={{ background: C.ink, color: C.muted }}
                >
                  {isVideo ? <Film size={10} /> : <ImageIcon size={10} />}{" "}
                  {RATIOS.find((r) => r.id === ratio)?.sub.split(" · ")[0]}
                </span>
              </div>
            )}
            <label className="text-xs" style={{ color: C.muted }}>
              {isVideo ? "Script" : "Caption"}
            </label>
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (isVideo) {
                  setVideoUrl(null);
                  setRenderError(null);
                }
              }}
              rows={isVideo ? 6 : 5}
              className="w-full resize-none rounded-lg px-3 py-2 font-mono text-sm outline-none"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
            {isVideo && (
              <div>
                <button
                  onClick={renderVideo}
                  disabled={rendering || !draft.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
                  style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
                >
                  {rendering ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Film size={15} />
                  )}
                  {rendering
                    ? "Rendering video…"
                    : videoUrl
                      ? "Re-render video"
                      : "Render video"}
                </button>
                {renderError && (
                  <p className="mt-1.5 text-[11px]" style={{ color: C.red }}>
                    {renderError}
                  </p>
                )}
                {!videoUrl && !rendering && !renderError && (
                  <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
                    Render the script into a branded video before scheduling.
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-xs" style={{ color: C.muted }}>
                Schedule for
              </label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="mt-1 w-full rounded-lg px-3 py-2 font-mono text-sm outline-none"
                style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
              />
            </div>
            <button
              onClick={handleSchedule}
              disabled={
                targets.size === 0 || !scheduleAt || submitting || (isVideo && !videoUrl)
              }
              className="w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
              style={{ background: C.green, color: C.ink }}
            >
              {submitting
                ? "Adding…"
                : `Add to queue · ${targets.size} platform${targets.size !== 1 ? "s" : ""}`}
            </button>
            {scheduleError && (
              <p className="text-[11px]" style={{ color: C.red }}>
                {scheduleError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
