// src/components/property/property-status-badge.tsx

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Warna disamakan dengan tile Property Summary di dashboard (PropertySummary.tsx).
const PROPERTY_STATUS_CONFIG: Record<string, { className: string }> = {
  available: { className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" },
  booked: { className: "border-amber-500/40 text-amber-600 dark:text-amber-400" },
  sold: { className: "border-blue-500/40 text-blue-600 dark:text-blue-400" },
  hold: { className: "border-slate-400/40 text-slate-600 dark:text-slate-400" },
};

export function PropertyStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;

  const config = PROPERTY_STATUS_CONFIG[status] ?? { className: "" };

  return (
    <Badge variant="outline" className={cn(config.className)}>
      {status}
    </Badge>
  );
}
