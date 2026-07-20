import Link from "next/link";
import { C } from "@/lib/theme";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: C.ink }}>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs font-medium"
          style={{ color: C.muted }}
        >
          ← Back to SMW
        </Link>

        <h1 className="text-2xl font-bold" style={{ color: C.paper }}>
          {title}
        </h1>
        <p className="mt-1 font-mono text-xs" style={{ color: C.muted }}>
          Last updated {updated}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed" style={{ color: C.paper }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.amber }}>
        {heading}
      </h2>
      <div className="space-y-3" style={{ color: C.paper }}>
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5" style={{ color: C.paper }}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
