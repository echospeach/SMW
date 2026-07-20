import { C } from "@/lib/theme";

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Billing
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Pick the plan that matches how much you&apos;re posting.
      </p>
      <p className="mt-6 text-sm" style={{ color: C.muted }}>
        Coming soon.
      </p>
    </div>
  );
}
