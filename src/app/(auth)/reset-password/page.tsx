"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/actions/password-reset";
import { C } from "@/lib/theme";

function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  const token = useSearchParams().get("token") ?? "";

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
          Set a new password
        </h1>

        {state?.success ? (
          <>
            <p className="text-sm" style={{ color: C.paper }}>
              Password updated. You can log in with it now.
            </p>
            <Link
              href="/login"
              className="mt-4 block w-full rounded-lg py-2.5 text-center text-sm font-medium"
              style={{ background: C.amber, color: C.ink }}
            >
              Go to log in
            </Link>
          </>
        ) : !token ? (
          <p className="text-sm" style={{ color: C.red }}>
            This reset link is missing its token. Request a new one from{" "}
            <Link href="/forgot-password" className="underline">
              the reset page
            </Link>
            .
          </p>
        ) : (
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="text-xs" style={{ color: C.muted }}>
                New password
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
            <div>
              <label className="text-xs" style={{ color: C.muted }}>
                Confirm password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
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
              {pending ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-4 text-xs" style={{ color: C.muted }}>
          <Link href="/login" className="underline" style={{ color: C.paper }}>
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
