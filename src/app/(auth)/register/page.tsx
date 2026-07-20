"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import { C } from "@/lib/theme";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, undefined);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
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
          Create your account
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
            <label className="text-xs" style={{ color: C.muted }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
            />
            <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
              At least 8 characters.
            </p>
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
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-xs" style={{ color: C.muted }}>
          Already have an account?{" "}
          <Link href="/login" className="underline" style={{ color: C.paper }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
