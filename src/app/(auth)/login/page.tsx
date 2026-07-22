"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { C } from "@/lib/theme";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: C.ink }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <div className="mb-6 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold"
            style={{ background: C.amber, color: C.ink }}
          >
            S
          </div>
          <span className="text-sm font-bold tracking-widest" style={{ color: C.paper }}>
            SMW
          </span>
        </div>

        <h1 className="mb-4 text-lg font-bold" style={{ color: C.paper }}>
          Log in
        </h1>

        <form action={formAction} className="space-y-3">
          <div>
            <label className="text-xs" style={{ color: C.muted }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: C.muted }}>
                Password
              </label>
              <Link href="/forgot-password" className="text-xs underline" style={{ color: C.muted }}>
                Forgot password?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
          </div>

          {state?.error && (
            <p className="text-xs" style={{ color: C.red }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
            style={{ background: C.amber, color: C.ink }}
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-xs" style={{ color: C.muted }}>
          No account?{" "}
          <Link href="/register" className="underline" style={{ color: C.paper }}>
            Register
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-[11px]" style={{ color: C.muted }}>
        <Link href="/privacy" className="underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>
      </p>
    </div>
  );
}
