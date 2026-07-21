"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PlatformId } from "@/generated/prisma/enums";
import { PLATFORMS, C } from "@/lib/theme";
import { PlatformBadge } from "@/components/ui/platform-badge";

export type ConnectionState = Record<PlatformId, { connected: boolean; handle: string | null }>;

// These connect via a real OAuth round trip (see src/app/api/accounts/<platform>/authorize)
// instead of the generic mock POST -- everything else still uses toggle().
const OAUTH_PLATFORMS: PlatformId[] = ["FACEBOOK"];

export function AccountsView({ initial }: { initial: ConnectionState }) {
  const [connections, setConnections] = useState(initial);
  const [pendingPlatform, setPendingPlatform] = useState<PlatformId | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(platformId: PlatformId) {
    const connected = connections[platformId].connected;
    setPendingPlatform(platformId);
    startTransition(async () => {
      const res = await fetch(`/api/accounts/${platformId.toLowerCase()}`, {
        method: connected ? "DELETE" : "POST",
      });
      if (res.ok) {
        const { connection } = await res.json();
        setConnections((prev) => ({
          ...prev,
          [platformId]: { connected: connection.connected, handle: connection.handle },
        }));
        router.refresh();
      }
      setPendingPlatform(null);
    });
  }

  return (
    <div className="space-y-2.5">
      {PLATFORMS.map((p) => {
        const state = connections[p.id];
        const busy = isPending && pendingPlatform === p.id;
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl p-3.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <PlatformBadge id={p.id} size={18} />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: C.paper }}>
                {p.name}
              </div>
              <div className="font-mono text-[11px]" style={{ color: C.muted }}>
                {state.connected ? state.handle : "Not connected"}
              </div>
            </div>
            {!state.connected && OAUTH_PLATFORMS.includes(p.id) ? (
              <a
                href={`/api/accounts/${p.id.toLowerCase()}/authorize`}
                className="rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ background: C.amber, color: C.ink, border: `1px solid ${C.amber}` }}
              >
                Connect
              </a>
            ) : (
              <button
                onClick={() => toggle(p.id)}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                style={{
                  background: state.connected ? "transparent" : C.amber,
                  color: state.connected ? C.red : C.ink,
                  border: `1px solid ${state.connected ? C.red : C.amber}`,
                }}
              >
                {busy ? "…" : state.connected ? "Disconnect" : "Connect"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
