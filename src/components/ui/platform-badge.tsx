import type { PlatformId } from "@/generated/prisma/enums";
import { C, getPlatformMeta } from "@/lib/theme";
import { PlatformIcon } from "./platform-icon";

export function PlatformBadge({ id, size = 16 }: { id: PlatformId; size?: number }) {
  const meta = getPlatformMeta(id);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size + 14,
        height: size + 14,
        background: C.raised,
        border: `1px solid ${C.line}`,
      }}
      title={meta.name}
    >
      <PlatformIcon id={id} size={size} color={meta.dot} />
    </span>
  );
}
