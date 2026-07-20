import { Briefcase, Camera, Music2, Play, ThumbsUp, X as XGlyph } from "lucide-react";
import type { PlatformId } from "@/generated/prisma/enums";

// lucide-react v1 dropped brand/logo icons entirely; these are generic stand-ins
// paired with each platform's brand-color dot (see theme.ts PLATFORMS).
export function PlatformIcon({
  id,
  size = 16,
  color,
}: {
  id: PlatformId;
  size?: number;
  color: string;
}) {
  switch (id) {
    case "FACEBOOK":
      return <ThumbsUp size={size} color={color} strokeWidth={2} />;
    case "INSTAGRAM":
      return <Camera size={size} color={color} strokeWidth={2} />;
    case "X":
      return <XGlyph size={size} color={color} strokeWidth={2} />;
    case "LINKEDIN":
      return <Briefcase size={size} color={color} strokeWidth={2} />;
    case "TIKTOK":
      return <Music2 size={size} color={color} strokeWidth={2} />;
    case "YOUTUBE":
      return <Play size={size} color={color} strokeWidth={2} />;
  }
}
