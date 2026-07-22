import { Film } from "lucide-react";
import type { PostSummary } from "@/types";
import { C, RATIOS, STATUS_META } from "@/lib/theme";
import { PlatformBadge } from "./platform-badge";
import { StatusIcon } from "./status-icon";

function fmtDay(d: Date) {
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Ticket({ post }: { post: PostSummary }) {
  const meta = STATUS_META[post.status];
  const when = post.scheduledAt ?? post.publishedAt ?? post.createdAt;
  const isNext = post.status === "SCHEDULED";
  const ratioMeta = post.ratio ? RATIOS.find((r) => r.id === post.ratio) : null;

  return (
    <div
      className="relative flex items-center gap-3 rounded-lg px-3 py-3"
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
        <div className="flex items-center gap-1.5">
          {post.type === "VIDEO" &&
            (post.videoUrl ? (
              <a
                href={post.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] hover:opacity-80"
                style={{ background: C.amber, color: C.ink }}
              >
                <Film size={10} /> Watch
              </a>
            ) : (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]"
                style={{ background: C.ink, color: C.amber }}
              >
                <Film size={10} /> {post.duration ?? "0:15"}
              </span>
            ))}
          {ratioMeta && (
            <span
              className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{ background: C.ink, color: C.muted }}
            >
              {ratioMeta.sub.split(" ")[0]}
            </span>
          )}
          <p className="truncate text-sm" style={{ color: C.paper }}>
            {post.text}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-[11px]" style={{ color: C.muted }}>
            {fmtDay(when)} · {fmtTime(when)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isNext && (
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: C.amber }}
          />
        )}
        <StatusIcon status={post.status} size={13} color={meta.color} />
        <span className="font-mono text-[11px]" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}
