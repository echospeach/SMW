"use client";

import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import type { ContentType, PlatformId } from "@/generated/prisma/enums";
import { C, getPlatformMeta } from "@/lib/theme";
import { StatCard } from "@/components/ui/stat-card";
import { PlatformBadge } from "@/components/ui/platform-badge";

type PostMetrics = {
  impressions?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  views?: number | null;
};

type AnalyticsPost = {
  id: string;
  platformId: PlatformId;
  text: string;
  type: ContentType;
  publishedAt: string | Date | null;
  imageUrl: string | null;
  metricsAvailable: boolean;
  metrics: PostMetrics | null;
};

function sum(posts: AnalyticsPost[], key: keyof PostMetrics): number {
  return posts.reduce((acc, p) => acc + (p.metrics?.[key] ?? 0), 0);
}

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function AnalyticsView({ posts }: { posts: AnalyticsPost[] }) {
  const withMetrics = posts.filter((p) => p.metricsAvailable && p.metrics);
  const anyConnectedRealAccount = posts.some((p) => p.metricsAvailable);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <StatCard eyebrow="Published" value={posts.length} sub="Total posts" />
        <StatCard eyebrow="Impressions" value={sum(withMetrics, "impressions")} sub="Tracked posts" />
        <StatCard eyebrow="Likes" value={sum(withMetrics, "likes")} sub="Tracked posts" />
        <StatCard eyebrow="Comments" value={sum(withMetrics, "comments")} sub="Tracked posts" />
      </div>

      {!anyConnectedRealAccount && (
        <div
          className="rounded-xl p-4 text-xs"
          style={{ background: C.panel, border: `1px dashed ${C.line}`, color: C.muted }}
        >
          Analytics needs a real connected account to fetch performance data. Connect one in
          Accounts to start tracking impressions, likes, comments, and shares here.
        </div>
      )}

      <div className="space-y-2">
        {posts.length === 0 && (
          <p className="text-sm" style={{ color: C.muted }}>
            Nothing published yet — analytics will show up here once your first post goes live.
          </p>
        )}
        {posts.map((post) => {
          const meta = getPlatformMeta(post.platformId);
          return (
            <div
              key={post.id}
              className="flex items-center gap-3 rounded-lg px-3 py-3"
              style={{ background: C.panel, border: `1px dashed ${C.line}` }}
            >
              <PlatformBadge id={post.platformId} />
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded object-cover"
                  style={{ border: `1px solid ${C.line}` }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm" style={{ color: C.paper }}>
                  {post.text}
                </p>
                <span className="font-mono text-[11px]" style={{ color: C.muted }}>
                  {meta.name} · {fmtDate(post.publishedAt)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {post.metricsAvailable && post.metrics ? (
                  <>
                    <Stat icon={Eye} value={post.metrics.impressions ?? post.metrics.views} />
                    <Stat icon={Heart} value={post.metrics.likes} />
                    <Stat icon={MessageCircle} value={post.metrics.comments} />
                    <Stat icon={Share2} value={post.metrics.shares} />
                  </>
                ) : (
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                    style={{ background: C.raised, color: C.muted }}
                  >
                    {post.metricsAvailable ? "No data yet" : "Analytics unavailable"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
}: {
  icon: typeof Eye;
  value: number | null | undefined;
}) {
  return (
    <span className="flex items-center gap-1 font-mono text-[11px]" style={{ color: C.muted }}>
      <Icon size={11} /> {value ?? 0}
    </span>
  );
}
