import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react";
import type { PostStatus } from "@/generated/prisma/enums";

export function StatusIcon({
  status,
  size = 13,
  color,
}: {
  status: PostStatus;
  size?: number;
  color: string;
}) {
  switch (status) {
    case "PUBLISHED":
      return <CheckCircle2 size={size} color={color} />;
    case "SCHEDULED":
      return <Clock size={size} color={color} />;
    case "DRAFT":
      return <Circle size={size} color={color} />;
    case "FAILED":
      return <AlertTriangle size={size} color={color} />;
  }
}
