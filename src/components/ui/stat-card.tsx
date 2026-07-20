import { C } from "@/lib/theme";

export function StatCard({
  eyebrow,
  value,
  sub,
}: {
  eyebrow: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      className="min-w-[140px] flex-1 rounded-xl p-4"
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      <div className="font-mono text-[10px] tracking-[0.15em] uppercase" style={{ color: C.muted }}>
        {eyebrow}
      </div>
      <div className="mt-1.5 text-2xl font-bold" style={{ color: C.paper }}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs" style={{ color: C.muted }}>
          {sub}
        </div>
      )}
    </div>
  );
}
