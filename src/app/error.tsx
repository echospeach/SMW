"use client";

import { C, SUPPORT_EMAIL } from "@/lib/theme";
import { LogoMark } from "@/components/ui/logo-mark";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: C.ink }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 text-center"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <div className="mb-6 flex items-center justify-center gap-2">
          <LogoMark />
          <span className="text-sm font-bold tracking-widest" style={{ color: C.paper }}>
            SMW
          </span>
        </div>

        <h1 className="mb-1 text-lg font-bold" style={{ color: C.paper }}>
          Something went wrong
        </h1>
        <p className="mb-4 text-xs" style={{ color: C.muted }}>
          An unexpected error occurred. You can try again, or come back in a moment.
        </p>

        <button
          onClick={reset}
          className="w-full rounded-lg py-2.5 text-sm font-medium"
          style={{ background: C.amber, color: C.ink }}
        >
          Try again
        </button>

        <p className="mt-4 text-xs" style={{ color: C.muted }}>
          Still stuck?{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline" style={{ color: C.paper }}>
            Email {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
