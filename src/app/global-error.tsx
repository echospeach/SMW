"use client";

import { C, SUPPORT_EMAIL } from "@/lib/theme";

// Catches errors thrown by the root layout itself -- the one case root
// error.tsx can't catch. Kept minimal (no next/font, no Tailwind reliance)
// since this replaces the entire document if something upstream is broken.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            background: C.ink,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 384,
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              background: C.panel,
              border: `1px solid ${C.line}`,
            }}
          >
            <h1 style={{ marginBottom: 4, fontSize: 18, fontWeight: 700, color: C.paper }}>
              Something went wrong
            </h1>
            <p style={{ marginBottom: 16, fontSize: 12, color: C.muted }}>
              The app hit an unexpected error loading this page.
            </p>
            <button
              onClick={reset}
              style={{
                width: "100%",
                borderRadius: 8,
                padding: "10px 0",
                fontSize: 14,
                fontWeight: 500,
                background: C.amber,
                color: C.ink,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <p style={{ marginTop: 16, fontSize: 12, color: C.muted }}>
              Still stuck?{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.paper }}>
                Email {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
