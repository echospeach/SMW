import { C } from "@/lib/theme";

export default function StudioPage() {
  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Content Studio
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Brief it, generate it, schedule it.
      </p>
      <p className="mt-6 text-sm" style={{ color: C.muted }}>
        Coming soon.
      </p>
    </div>
  );
}
