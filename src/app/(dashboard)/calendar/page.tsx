import { C } from "@/lib/theme";

export default function CalendarPage() {
  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Calendar
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Your posting schedule across the next 7 days.
      </p>
      <p className="mt-6 text-sm" style={{ color: C.muted }}>
        Coming soon.
      </p>
    </div>
  );
}
