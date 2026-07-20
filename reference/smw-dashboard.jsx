import React, { useState, useMemo } from "react";
import {
  Facebook, Instagram, Twitter, Linkedin, Youtube, Music2,
  LayoutDashboard, PenSquare, Users, CalendarDays,
  Sparkles, Clock, CheckCircle2, Circle, AlertTriangle,
  Plus, ChevronRight, Loader2, Radio, X as CloseIcon,
  Video, Play, Film, Zap, PlusCircle, Trash2, ToggleLeft, ToggleRight, Image as ImageIcon,
  TrendingUp, Flame, RefreshCw, CreditCard, Check, Star
} from "lucide-react";

const C = {
  ink: "#12151C",
  panel: "#1A1F29",
  raised: "#212836",
  paper: "#EDE9DD",
  muted: "#8890A0",
  amber: "#F2A93B",
  green: "#5FB88F",
  red: "#E2645A",
  line: "#2A303D",
};

const PLATFORMS = [
  { id: "facebook", name: "Facebook", Icon: Facebook, dot: "#4267B2", handle: "@smw.page" },
  { id: "instagram", name: "Instagram", Icon: Instagram, dot: "#E1306C", handle: "@smw.ig" },
  { id: "x", name: "X", Icon: Twitter, dot: "#EDE9DD", handle: "@smw_hq" },
  { id: "linkedin", name: "LinkedIn", Icon: Linkedin, dot: "#0A66C2", handle: "SMW Inc." },
  { id: "tiktok", name: "TikTok", Icon: Music2, dot: "#8890A0", handle: "@smw" },
  { id: "youtube", name: "YouTube", Icon: Youtube, dot: "#FF4B4B", handle: "SMW Channel" },
];

const INITIAL_CONNECTIONS = {
  facebook: true, instagram: true, x: true,
  linkedin: false, tiktok: false, youtube: false,
};

const INITIAL_AUTOMATION = {
  facebook: { enabled: true, times: ["09:00", "13:30", "19:00"] },
  instagram: { enabled: true, times: ["08:30", "17:00"] },
  x: { enabled: true, times: ["09:00", "12:00", "16:00"] },
  linkedin: { enabled: false, times: ["10:00"] },
  tiktok: { enabled: false, times: ["18:00"] },
  youtube: { enabled: false, times: ["15:00"] },
};

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(d) {
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function seedQueue() {
  const now = new Date();
  const mk = (hoursOut, platformId, text, status) => {
    const d = new Date(now.getTime() + hoursOut * 3600 * 1000);
    return { id: `${platformId}-${hoursOut}-${Math.random().toString(36).slice(2, 7)}`, platformId, text, status, when: d };
  };
  return [
    mk(-26, "instagram", "New drop alert — swipe through the full lineup before it sells out.", "published"),
    mk(-4, "facebook", "Behind the scenes at this week's shoot. Full gallery in comments.", "published"),
    mk(2, "x", "Quick tip thread on getting more out of your Monday planning session.", "scheduled"),
    mk(6, "instagram", "Carousel: 5 mistakes we see brands make with their first campaign.", "scheduled"),
    { ...mk(14, "tiktok", "Day-in-the-life reel scripted and rendered from this morning's brief.", "scheduled"), type: "video", duration: "0:24", ratio: "portrait" },
    mk(20, "facebook", "Weekend reminder — store hours are changing starting next month.", "scheduled"),
    mk(30, "x", "Draft awaiting a second look before it goes out to the timeline.", "draft"),
    mk(48, "instagram", "Reel concept: a day-in-the-life walkthrough of the studio.", "scheduled"),
  ].sort((a, b) => a.when - b.when);
}

const RATIOS = [
  { id: "portrait", label: "Portrait", sub: "9:16 · Reels & Stories", ratio: "9 / 16" },
  { id: "square", label: "Square", sub: "1:1 · Feed", ratio: "1 / 1" },
  { id: "landscape", label: "Landscape", sub: "16:9 · Wide/YouTube", ratio: "16 / 9" },
];
const DEFAULT_RATIO_BY_TYPE = {
  text_post: "square", image_post: "square", carousel: "square", story: "portrait", video: "portrait",
};

const TREND_POOL = [
  { label: "Sunday reset routines", heat: "high", tag: "lifestyle" },
  { label: "AI tools for small teams", heat: "high", tag: "tech" },
  { label: "Quiet luxury aesthetic", heat: "medium", tag: "style" },
  { label: "Local vs. big brand loyalty", heat: "medium", tag: "business" },
  { label: "Behind-the-scenes content", heat: "high", tag: "format" },
  { label: "Cost-of-living hacks", heat: "medium", tag: "finance" },
  { label: "Founder story reels", heat: "high", tag: "format" },
  { label: "Slow mornings, fast wins", heat: "low", tag: "lifestyle" },
  { label: "Product restock countdowns", heat: "medium", tag: "commerce" },
  { label: "Real talk about burnout", heat: "high", tag: "wellness" },
];
function pickTrends(n = 5) {
  return [...TREND_POOL].sort(() => Math.random() - 0.5).slice(0, n);
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Testing the waters, one account at a time.",
    monthly: 19,
    yearly: 180,
    features: [
      "2 connected accounts",
      "1 auto-post per day, per account",
      "Text & image content",
      "Manual scheduling",
      "7-day post history",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For creators and small teams posting daily.",
    monthly: 49,
    yearly: 468,
    popular: true,
    features: [
      "5 connected accounts",
      "Up to 3 auto-posts a day, per account",
      "Video generation included",
      "Full automation engine",
      "Trending topic blending",
      "30-day post history",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "Agencies and brands running multiple accounts.",
    monthly: 149,
    yearly: 1428,
    features: [
      "Unlimited connected accounts",
      "Unlimited auto-posts a day",
      "Priority video rendering",
      "Team seats & shared approvals",
      "Trending topic blending",
      "Full post history & analytics",
    ],
  },
];

const STATUS_META = {
  published: { label: "Published", color: C.green, Icon: CheckCircle2 },
  scheduled: { label: "Scheduled", color: C.amber, Icon: Clock },
  draft: { label: "Needs review", color: C.muted, Icon: Circle },
  failed: { label: "Failed", color: C.red, Icon: AlertTriangle },
};

function PlatformBadge({ id, size = 16 }) {
  const p = PLATFORMS.find((x) => x.id === id);
  if (!p) return null;
  const { Icon } = p;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size + 14, height: size + 14, background: C.raised, border: `1px solid ${C.line}` }}
      title={p.name}
    >
      <Icon size={size} color={p.dot} strokeWidth={2} />
    </span>
  );
}

function NavItem({ icon: Icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
      style={{
        background: active ? C.raised : "transparent",
        color: active ? C.paper : C.muted,
      }}
    >
      <Icon size={17} strokeWidth={2} />
      <span className="flex-1 text-left font-medium tracking-wide">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span
          className="text-[11px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: active ? C.ink : C.raised, color: C.amber }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ eyebrow, value, sub }) {
  return (
    <div className="rounded-xl p-4 flex-1 min-w-[140px]" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: C.muted }}>{eyebrow}</div>
      <div className="text-2xl font-bold mt-1.5" style={{ color: C.paper }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</div>}
    </div>
  );
}

function Ticket({ item }) {
  const meta = STATUS_META[item.status];
  const isNext = item.status === "scheduled";
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-3 relative"
      style={{ background: C.panel, border: `1px dashed ${C.line}` }}
    >
      <PlatformBadge id={item.platformId} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {item.type === "video" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: C.ink, color: C.amber }}>
              <Film size={10} /> {item.duration || "0:15"}
            </span>
          )}
          {item.ratio && (
            <span className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: C.ink, color: C.muted }}>
              {RATIOS.find((r) => r.id === item.ratio)?.sub.split(" ")[0] || item.ratio}
            </span>
          )}
          <p className="text-sm truncate" style={{ color: C.paper }}>{item.text}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-mono" style={{ color: C.muted }}>
            {fmtDay(item.when)} · {fmtTime(item.when)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isNext && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.amber }} />}
        <meta.Icon size={13} color={meta.color} />
        <span className="text-[11px] font-mono" style={{ color: meta.color }}>{meta.label}</span>
      </div>
    </div>
  );
}

function DashboardView({ queue, connections, onNewContent }) {
  const scheduled = queue.filter((q) => q.status === "scheduled").length;
  const published = queue.filter((q) => q.status === "published").length;
  const drafts = queue.filter((q) => q.status === "draft").length;
  const connectedCount = Object.values(connections).filter(Boolean).length;
  const next = queue.find((q) => q.status === "scheduled");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <StatCard eyebrow="Scheduled" value={scheduled} sub="Queued to publish" />
        <StatCard eyebrow="Published" value={published} sub="Last 7 days" />
        <StatCard eyebrow="Awaiting review" value={drafts} sub="Sitting in drafts" />
        <StatCard eyebrow="Accounts live" value={`${connectedCount}/${PLATFORMS.length}`} sub="Connected & posting" />
      </div>

      {next && (
        <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: C.raised, border: `1px solid ${C.line}` }}>
          <Radio size={18} color={C.amber} className="shrink-0" />
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: C.amber }}>Next in queue</div>
            <div className="text-sm mt-0.5" style={{ color: C.paper }}>{next.text}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-mono" style={{ color: C.paper }}>{fmtTime(next.when)}</div>
            <div className="text-[11px]" style={{ color: C.muted }}>{fmtDay(next.when)}</div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
            <h2 className="text-xs font-mono uppercase tracking-[0.15em]" style={{ color: C.muted }}>Live queue</h2>
          </div>
          <button
            onClick={onNewContent}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: C.amber, color: C.ink }}
          >
            <Plus size={14} /> New content
          </button>
        </div>
        <div className="space-y-2">
          {queue.map((item) => <Ticket key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
}

function ContentStudio({ connections, onSchedule }) {
  const [type, setType] = useState("text_post");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Confident");
  const [targets, setTargets] = useState(() => new Set(["instagram"]));
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");
  const [videoDuration, setVideoDuration] = useState(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [ratio, setRatio] = useState(DEFAULT_RATIO_BY_TYPE.text_post);
  const [ratioTouched, setRatioTouched] = useState(false);
  const [trends, setTrends] = useState(() => pickTrends());
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [refreshingTrends, setRefreshingTrends] = useState(false);
  const isVideo = type === "video";
  const isVisual = type !== "text_post";

  function refreshTrends() {
    setRefreshingTrends(true);
    setTimeout(() => {
      setTrends(pickTrends());
      setRefreshingTrends(false);
    }, 600);
  }
  function toggleTrend(t) {
    setSelectedTrend((prev) => (prev?.label === t.label ? null : t));
  }

  function handleTypeChange(newType) {
    setType(newType);
    if (!ratioTouched) setRatio(DEFAULT_RATIO_BY_TYPE[newType]);
  }
  function handleRatioChange(id) {
    setRatio(id);
    setRatioTouched(true);
  }

  const connectedPlatforms = PLATFORMS.filter((p) => connections[p.id]);

  function toggleTarget(id) {
    setTargets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setDraft("");
    setVideoDuration(null);
    setTimeout(() => {
      const trendPhrase = selectedTrend ? `, tying it into "${selectedTrend.label}"` : "";
      if (isVideo) {
        const scripts = {
          Confident: `[Hook] ${topic} — here's what nobody's telling you${trendPhrase}.\n[Beat 1] The problem, in one shot.\n[Beat 2] What we did differently.\n[CTA] Follow for the full story.`,
          Playful: `[Hook] POV: ${topic.toLowerCase()}${selectedTrend ? ` meets ${selectedTrend.label.toLowerCase()}` : ""} 👀\n[Beat 1] cut to the chaos\n[Beat 2] cut to the payoff\n[CTA] tell us we're not the only ones`,
          Informative: `[Hook] Let's break down ${topic.toLowerCase()} in under 30 seconds${trendPhrase}.\n[Beat 1] The context.\n[Beat 2] The 3 things that matter.\n[CTA] Save this for later.`,
        };
        const secs = 15 + Math.floor(Math.random() * 30);
        setVideoDuration(`0:${secs < 10 ? "0" : ""}${secs}`);
        setDraft(scripts[tone] || `${topic} — the short version.`);
      } else {
        const templates = {
          Confident: `${topic} — and we're not just saying that${trendPhrase}. Here's why it matters this week.`,
          Playful: `Ok but has anyone else noticed ${topic.toLowerCase()}${selectedTrend ? ` right as "${selectedTrend.label.toLowerCase()}" is everywhere` : ""}? asking for a friend 👀`,
          Informative: `A quick breakdown of ${topic.toLowerCase()}${trendPhrase}: what's changing, and what it means for you.`,
        };
        setDraft(templates[tone] || `${topic} — here's the story behind it.`);
      }
      setGenerating(false);
    }, isVideo ? 1800 : 1100);
  }

  function handleSchedule() {
    if (!draft.trim() || targets.size === 0 || !scheduleAt) return;
    onSchedule({
      text: draft, targets: Array.from(targets), when: new Date(scheduleAt),
      type: isVideo ? "video" : type, duration: isVideo ? videoDuration : null,
      ratio: isVisual ? ratio : null,
    });
    setDraft(""); setTopic(""); setScheduleAt(""); setVideoDuration(null);
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="rounded-xl p-5 space-y-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <h3 className="text-xs font-mono uppercase tracking-[0.15em]" style={{ color: C.muted }}>Brief</h3>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>Content type</label>
          <select
            value={type} onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
          >
            <option value="text_post">Text post</option>
            <option value="image_post">Image post</option>
            <option value="carousel">Carousel</option>
            <option value="story">Story</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>Topic</label>
          <input
            value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. our new product launch"
            className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none placeholder:opacity-50"
            style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-1.5" style={{ color: C.muted }}>
              <TrendingUp size={12} /> Trending now
            </label>
            <button onClick={refreshTrends} className="flex items-center gap-1 text-[11px]" style={{ color: C.muted }}>
              <RefreshCw size={11} className={refreshingTrends ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {trends.map((t) => (
              <button
                key={t.label} onClick={() => toggleTrend(t)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full"
                style={{
                  background: selectedTrend?.label === t.label ? C.amber : C.raised,
                  color: selectedTrend?.label === t.label ? C.ink : C.paper,
                  border: `1px solid ${selectedTrend?.label === t.label ? C.amber : C.line}`,
                }}
              >
                {t.heat === "high" && <Flame size={10} color={selectedTrend?.label === t.label ? C.ink : C.amber} />}
                {t.label}
              </button>
            ))}
          </div>
          {selectedTrend && (
            <div className="text-[11px] mt-1.5" style={{ color: C.muted }}>
              Draft will lean into <span style={{ color: C.amber }}>"{selectedTrend.label}"</span> alongside your topic.
            </div>
          )}
        </div>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>Tone</label>
          <div className="flex gap-2 mt-1.5">
            {["Confident", "Playful", "Informative"].map((t) => (
              <button
                key={t} onClick={() => setTone(t)}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: tone === t ? C.amber : C.raised,
                  color: tone === t ? C.ink : C.muted,
                  border: `1px solid ${tone === t ? C.amber : C.line}`,
                }}
              >{t}</button>
            ))}
          </div>
        </div>

        {isVisual && (
          <div>
            <label className="text-xs" style={{ color: C.muted }}>Format</label>
            <div className="flex gap-2 mt-1.5">
              {RATIOS.map((r) => (
                <button
                  key={r.id} onClick={() => handleRatioChange(r.id)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg"
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
                      background: "transparent",
                      border: `1.5px solid ${ratio === r.id ? C.amber : C.muted}`,
                    }}
                  />
                  <span className="text-[11px] font-medium" style={{ color: ratio === r.id ? C.paper : C.muted }}>{r.label}</span>
                  <span className="text-[9px] font-mono" style={{ color: C.muted }}>{r.sub.split(" · ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs" style={{ color: C.muted }}>Post to</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {connectedPlatforms.length === 0 && (
              <span className="text-xs" style={{ color: C.muted }}>Connect an account first in Accounts.</span>
            )}
            {connectedPlatforms.map((p) => (
              <button
                key={p.id} onClick={() => toggleTarget(p.id)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                style={{
                  background: targets.has(p.id) ? C.raised : "transparent",
                  border: `1px solid ${targets.has(p.id) ? C.amber : C.line}`,
                  color: C.paper,
                }}
              >
                <p.Icon size={13} color={p.dot} /> {p.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!topic.trim() || generating}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg mt-2 disabled:opacity-40"
          style={{ background: C.amber, color: C.ink }}
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : isVideo ? <Video size={15} /> : <Sparkles size={15} />}
          {generating ? (isVideo ? "Rendering video…" : "Generating…") : isVideo ? "Generate video" : "Generate draft"}
        </button>
      </div>

      <div className="rounded-xl p-5 space-y-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <h3 className="text-xs font-mono uppercase tracking-[0.15em]" style={{ color: C.muted }}>{isVideo ? "Video" : "Draft"}</h3>
        {!draft && !generating && (
          <div className="h-32 flex items-center justify-center text-xs text-center px-6" style={{ color: C.muted }}>
            {isVideo
              ? "Fill in a topic and generate a video — you'll get a script and a rendered preview to edit."
              : "Fill in a topic and generate a draft — it'll land here for you to edit before it goes anywhere."}
          </div>
        )}
        {generating && (
          <div className="h-32 flex items-center justify-center gap-2 text-xs" style={{ color: C.muted }}>
            <Loader2 size={14} className="animate-spin" /> {isVideo ? "Rendering scenes…" : "Writing a draft…"}
          </div>
        )}
        {draft && !generating && (
          <>
            {isVisual && (
              <div
                className="rounded-lg flex items-center justify-center relative overflow-hidden mx-auto"
                style={{
                  aspectRatio: RATIOS.find((r) => r.id === ratio)?.ratio,
                  height: 220,
                  background: `linear-gradient(135deg, ${C.raised}, ${C.ink})`,
                  border: `1px solid ${C.line}`,
                }}
              >
                <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: C.amber }}>
                  {isVideo ? <Play size={18} color={C.ink} fill={C.ink} /> : <ImageIcon size={18} color={C.ink} />}
                </span>
                {isVideo && (
                  <span
                    className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: C.ink, color: C.paper }}
                  >
                    {videoDuration}
                  </span>
                )}
                <span
                  className="absolute top-2 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
                  style={{ background: C.ink, color: C.muted }}
                >
                  {isVideo ? <Film size={10} /> : <ImageIcon size={10} />} {RATIOS.find((r) => r.id === ratio)?.sub.split(" · ")[0]}
                </span>
              </div>
            )}
            <label className="text-xs" style={{ color: C.muted }}>{isVideo ? "Script" : "Caption"}</label>
            <textarea
              value={draft} onChange={(e) => setDraft(e.target.value)} rows={isVideo ? 6 : 5}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none font-mono"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
            <div>
              <label className="text-xs" style={{ color: C.muted }}>Schedule for</label>
              <input
                type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)}
                className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none font-mono"
                style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
              />
            </div>
            <button
              onClick={handleSchedule}
              disabled={targets.size === 0 || !scheduleAt}
              className="w-full text-sm font-medium py-2.5 rounded-lg disabled:opacity-40"
              style={{ background: C.green, color: C.ink }}
            >
              Add to queue · {targets.size} platform{targets.size !== 1 ? "s" : ""}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AccountsView({ connections, setConnections }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-mono uppercase tracking-[0.15em] mb-3" style={{ color: C.muted }}>Connected accounts</h3>
      {PLATFORMS.map((p) => {
        const connected = connections[p.id];
        return (
          <div key={p.id} className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <PlatformBadge id={p.id} size={18} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: C.paper }}>{p.name}</div>
              <div className="text-[11px] font-mono" style={{ color: C.muted }}>
                {connected ? p.handle : "Not connected"}
              </div>
            </div>
            <button
              onClick={() => setConnections((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                background: connected ? "transparent" : C.amber,
                color: connected ? C.red : C.ink,
                border: `1px solid ${connected ? C.red : C.amber}`,
              }}
            >
              {connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({ queue }) {
  const days = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((day, i) => {
        const items = queue.filter((q) => q.when.toDateString() === day.toDateString());
        return (
          <div key={i} className="rounded-lg p-2.5 min-h-[120px]" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="text-[10px] font-mono uppercase tracking-wide mb-2" style={{ color: i === 0 ? C.amber : C.muted }}>
              {i === 0 ? "Today" : day.toLocaleDateString([], { weekday: "short" })}
              <span className="block text-[9px] opacity-70">{day.toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            </div>
            <div className="space-y-1.5">
              {items.map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <div key={item.id} className="rounded px-1.5 py-1 flex items-center gap-1" style={{ background: C.raised }}>
                    <PlatformBadge id={item.platformId} size={10} />
                    <span className="text-[10px] font-mono truncate flex-1" style={{ color: meta.color }}>
                      {fmtTime(item.when)}
                    </span>
                  </div>
                );
              })}
              {items.length === 0 && <div className="text-[10px]" style={{ color: C.muted, opacity: 0.5 }}>—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AutomationView({ connections, automation, setAutomation, autoTrending, setAutoTrending }) {
  const activePlatforms = PLATFORMS.filter((p) => connections[p.id]);
  const totalPerDay = Object.entries(automation)
    .filter(([id]) => connections[id])
    .reduce((sum, [, cfg]) => sum + (cfg.enabled ? cfg.times.length : 0), 0);
  const activeCount = Object.entries(automation).filter(([id, cfg]) => connections[id] && cfg.enabled).length;

  function toggle(id) {
    setAutomation((prev) => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }));
  }
  function addTime(id) {
    setAutomation((prev) => ({ ...prev, [id]: { ...prev[id], times: [...prev[id].times, "12:00"] } }));
  }
  function updateTime(id, idx, value) {
    setAutomation((prev) => {
      const times = [...prev[id].times];
      times[idx] = value;
      return { ...prev, [id]: { ...prev[id], times } };
    });
  }
  function removeTime(id, idx) {
    setAutomation((prev) => ({ ...prev, [id]: { ...prev[id], times: prev[id].times.filter((_, i) => i !== idx) } }));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: C.raised, border: `1px solid ${C.line}` }}>
        <Zap size={20} color={C.amber} className="shrink-0" />
        <div>
          <div className="text-sm font-medium" style={{ color: C.paper }}>
            Posting {totalPerDay}x a day across {activeCount} account{activeCount !== 1 ? "s" : ""}
          </div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>
            At each slot below, SMW pulls the next approved draft from the content pipeline and publishes it automatically. No draft ready → the slot is skipped, not filled with junk.
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <TrendingUp size={20} color={autoTrending ? C.amber : C.muted} className="shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: C.paper }}>Blend trending topics automatically</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>
            When a slot generates its own content, SMW checks what's trending in your niche and works it into the brief where it fits — never forced, never off-topic.
          </div>
        </div>
        <button onClick={() => setAutoTrending((v) => !v)} className="shrink-0" style={{ color: autoTrending ? C.green : C.muted }}>
          {autoTrending ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
        </button>
      </div>

      {activePlatforms.length === 0 && (
        <div className="text-sm text-center py-10" style={{ color: C.muted }}>
          Connect an account in Accounts to set up its posting rhythm.
        </div>
      )}

      {activePlatforms.map((p) => {
        const cfg = automation[p.id];
        return (
          <div key={p.id} className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-3 mb-3">
              <PlatformBadge id={p.id} size={16} />
              <span className="text-sm font-medium flex-1" style={{ color: C.paper }}>{p.name}</span>
              <button onClick={() => toggle(p.id)} className="flex items-center gap-1.5 text-xs" style={{ color: cfg.enabled ? C.green : C.muted }}>
                {cfg.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                {cfg.enabled ? "Auto-posting on" : "Paused"}
              </button>
            </div>

            {cfg.enabled && (
              <div className="pl-[30px] space-y-2">
                <div className="flex flex-wrap gap-2">
                  {cfg.times.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1 rounded-lg pl-2 pr-1 py-1" style={{ background: C.raised, border: `1px solid ${C.line}` }}>
                      <input
                        type="time" value={t} onChange={(e) => updateTime(p.id, idx, e.target.value)}
                        className="bg-transparent text-xs font-mono outline-none" style={{ color: C.paper, colorScheme: "dark" }}
                      />
                      <button onClick={() => removeTime(p.id, idx)} className="p-1 rounded" style={{ color: C.muted }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addTime(p.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ color: C.amber, border: `1px dashed ${C.amber}` }}
                  >
                    <PlusCircle size={13} /> Add time slot
                  </button>
                </div>
                <div className="text-[11px] font-mono" style={{ color: C.muted }}>
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

function BillingView({ currentPlan, setCurrentPlan }) {
  const [cycle, setCycle] = useState("monthly");

  function priceFor(plan) {
    if (cycle === "monthly") return { amount: plan.monthly, per: "/mo" };
    return { amount: Math.round(plan.yearly / 12), per: "/mo", note: `billed $${plan.yearly}/yr` };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-1 rounded-full p-1 w-fit mx-auto" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        {["monthly", "yearly"].map((c) => (
          <button
            key={c} onClick={() => setCycle(c)}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-full capitalize"
            style={{ background: cycle === c ? C.amber : "transparent", color: cycle === c ? C.ink : C.muted }}
          >
            {c}
            {c === "yearly" && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                style={{ background: cycle === c ? C.ink : C.raised, color: cycle === c ? C.amber : C.green }}
              >
                Save 20%
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const price = priceFor(plan);
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-xl p-5 flex flex-col relative"
              style={{
                background: C.panel,
                border: `1px solid ${plan.popular ? C.amber : C.line}`,
              }}
            >
              {plan.popular && (
                <span
                  className="absolute -top-2.5 left-5 flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: C.amber, color: C.ink }}
                >
                  <Star size={10} fill={C.ink} /> Most popular
                </span>
              )}
              <div className="text-sm font-bold mt-1" style={{ color: C.paper }}>{plan.name}</div>
              <div className="text-xs mt-1 mb-4" style={{ color: C.muted }}>{plan.tagline}</div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: C.paper }}>${price.amount}</span>
                <span className="text-xs" style={{ color: C.muted }}>{price.per}</span>
              </div>
              {price.note && <div className="text-[11px] font-mono mb-4" style={{ color: C.muted }}>{price.note}</div>}
              {!price.note && <div className="mb-4" />}

              <div className="flex-1 space-y-2 mb-5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs" style={{ color: C.paper }}>
                    <Check size={13} color={C.green} className="mt-0.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCurrentPlan(plan.id)}
                disabled={isCurrent}
                className="w-full text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
                style={{
                  background: isCurrent ? "transparent" : plan.popular ? C.amber : C.raised,
                  color: isCurrent ? C.muted : plan.popular ? C.ink : C.paper,
                  border: `1px solid ${isCurrent ? C.line : plan.popular ? C.amber : C.line}`,
                }}
              >
                {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-center" style={{ color: C.muted }}>
        Prices shown for prototyping — real checkout needs a payment processor (e.g. Stripe) wired to the backend.
      </div>
    </div>
  );
}

export default function SMWDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const [automation, setAutomation] = useState(INITIAL_AUTOMATION);
  const [autoTrending, setAutoTrending] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("starter");
  const [queue, setQueue] = useState(seedQueue);

  function handleSchedule({ text, targets, when, type, duration, ratio }) {
    const newItems = targets.map((platformId) => ({
      id: `${platformId}-${when.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      platformId, text, status: "scheduled", when, type, duration, ratio,
    }));
    setQueue((prev) => [...prev, ...newItems].sort((a, b) => a.when - b.when));
    setTab("dashboard");
  }

  const draftCount = queue.filter((q) => q.status === "draft").length;

  return (
    <div className="w-full min-h-screen flex font-sans" style={{ background: C.ink }}>
      <aside className="w-56 shrink-0 p-4 flex flex-col gap-1" style={{ borderRight: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm" style={{ background: C.amber, color: C.ink }}>S</div>
          <span className="font-bold tracking-widest text-sm" style={{ color: C.paper }}>SMW</span>
        </div>
        <NavItem icon={LayoutDashboard} label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
        <NavItem icon={PenSquare} label="Content Studio" active={tab === "studio"} onClick={() => setTab("studio")} />
        <NavItem icon={Zap} label="Automation" active={tab === "automation"} onClick={() => setTab("automation")} />
        <NavItem icon={Users} label="Accounts" active={tab === "accounts"} onClick={() => setTab("accounts")} />
        <NavItem icon={CalendarDays} label="Calendar" active={tab === "calendar"} onClick={() => setTab("calendar")} />
        <NavItem icon={CreditCard} label="Billing" active={tab === "billing"} onClick={() => setTab("billing")} />
        <div className="flex-1" />
        <button
          onClick={() => setTab("billing")}
          className="text-[11px] rounded-lg px-3 py-2 flex items-center justify-between"
          style={{ background: C.raised, color: C.muted }}
        >
          <span className="flex items-center gap-2"><CreditCard size={13} color={C.amber} /> {PLANS.find((p) => p.id === currentPlan)?.name} plan</span>
          <ChevronRight size={13} />
        </button>
        {draftCount > 0 && (
          <div className="text-[11px] rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: C.raised, color: C.muted }}>
            <AlertTriangle size={13} color={C.amber} />
            {draftCount} draft{draftCount !== 1 ? "s" : ""} need review
          </div>
        )}
      </aside>

      <main className="flex-1 p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold" style={{ color: C.paper }}>
            {tab === "dashboard" && "Dispatch"}
            {tab === "studio" && "Content Studio"}
            {tab === "automation" && "Automation"}
            {tab === "accounts" && "Accounts"}
            {tab === "calendar" && "Calendar"}
            {tab === "billing" && "Billing"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>
            {tab === "dashboard" && "Everything scheduled, published, or waiting on you."}
            {tab === "studio" && "Brief it, generate it, schedule it."}
            {tab === "automation" && "Set the rhythm — SMW keeps it running without you."}
            {tab === "accounts" && "Manage which accounts SMW can post to."}
            {tab === "calendar" && "Your posting schedule across the next 7 days."}
            {tab === "billing" && "Pick the plan that matches how much you're posting."}
          </p>
        </div>

        {tab === "dashboard" && <DashboardView queue={queue} connections={connections} onNewContent={() => setTab("studio")} />}
        {tab === "studio" && <ContentStudio connections={connections} onSchedule={handleSchedule} />}
        {tab === "automation" && <AutomationView connections={connections} automation={automation} setAutomation={setAutomation} autoTrending={autoTrending} setAutoTrending={setAutoTrending} />}
        {tab === "accounts" && <AccountsView connections={connections} setConnections={setConnections} />}
        {tab === "calendar" && <CalendarView queue={queue} />}
        {tab === "billing" && <BillingView currentPlan={currentPlan} setCurrentPlan={setCurrentPlan} />}
      </main>
    </div>
  );
}
