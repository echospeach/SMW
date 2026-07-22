"use client";

import { useActionState } from "react";
import { Shield } from "lucide-react";
import { adminLogin } from "@/lib/actions/admin-auth";
import { C } from "@/lib/theme";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLogin, undefined);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: C.ink }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ background: C.panel, border: `1px solid ${C.red}` }}
      >
        <div className="mb-6 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: C.red, color: C.ink }}
          >
            <Shield size={15} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-widest" style={{ color: C.paper }}>
            SMW ADMIN
          </span>
        </div>

        <h1 className="mb-4 text-lg font-bold" style={{ color: C.paper }}>
          Admin sign in
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
            style={{ background: C.red, color: C.ink }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
