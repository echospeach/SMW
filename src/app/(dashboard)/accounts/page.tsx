import { C } from "@/lib/theme";

export default function AccountsPage() {
  return (
    <div>
      <h1 className="text-lg font-bold" style={{ color: C.paper }}>
        Accounts
      </h1>
      <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
        Manage which accounts SMW can post to.
      </p>
      <p className="mt-6 text-sm" style={{ color: C.muted }}>
        Coming soon.
      </p>
    </div>
  );
}
