import { C } from "@/lib/theme";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Dispatch
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Everything scheduled, published, or waiting on you.
      </p>
      <p className="mt-6 text-sm" style={{ color: C.muted }}>
        Queue and stats land here once the data layer is wired up.
      </p>
    </div>
  );
}
