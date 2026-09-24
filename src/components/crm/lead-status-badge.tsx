// src/components/crm/lead-status-badge.tsx

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Urutan di sini = urutan pipeline sekaligus urutan opsi di LeadStatusSelect --
// satu-satunya tempat status lead didaftarkan, jangan duplikasi di tempat lain.
export const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; className?: string }
> = {
  new: { label: "New", variant: "secondary" },
  contacted: { label: "Contacted", variant: "outline" },
  qualified: { label: "Qualified", variant: "default" },
  proposal: { label: "Proposal", variant: "default" },
  negotiation: { label: "Negotiation", variant: "default" },
  won: {
    label: "Won",
    variant: "outline",
    className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  },
  lost: { label: "Lost", variant: "destructive" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const config = LEAD_STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
