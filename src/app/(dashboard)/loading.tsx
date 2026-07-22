import { C } from "@/lib/theme";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-5 w-40 animate-pulse rounded" style={{ background: C.panel }} />
        <div className="h-3 w-64 animate-pulse rounded" style={{ background: C.panel }} />
      </div>

      <div className="flex flex-wrap gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 min-w-[140px] flex-1 animate-pulse rounded-xl"
            style={{ background: C.panel, border: `1px dashed ${C.line}` }}
          />
        ))}
      </div>

      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg"
            style={{ background: C.panel, border: `1px dashed ${C.line}` }}
          />
        ))}
      </div>
    </div>
  );
}
