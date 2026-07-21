import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { C } from "@/lib/theme";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: C.ink }}
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md text-base font-bold"
            style={{ background: C.amber, color: C.ink }}
          >
            S
          </div>
          <span className="text-lg font-bold tracking-widest" style={{ color: C.paper }}>
            SMW
          </span>
        </div>

        <p className="mb-6 text-sm" style={{ color: C.muted }}>
          AI-powered social media scheduling and automation — draft, schedule, and auto-post
          across your accounts.
        </p>

        <div className="flex w-full gap-3">
          <Link
            href="/login"
            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
            style={{ background: C.amber, color: C.ink }}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
            style={{ border: `1px solid ${C.line}`, color: C.paper }}
          >
            Sign up
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px]" style={{ color: C.muted }}>
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
