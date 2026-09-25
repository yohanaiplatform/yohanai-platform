// src/components/crm/lead-status-badge.tsx

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Urutan di sini = urutan pipeline sekaligus urutan opsi di LeadStatusSelect --
// satu-satunya tempat status lead didaftarkan, jangan duplikasi di tempat lain.
// Warna sengaja progresif dingin -> hangat -> hasil, supaya tiap tahap beda
// kelihatan (sebelumnya qualified/proposal/negotiation sama-sama "default",
// tidak bisa dibedakan sekilas).
export const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; className?: string }
> = {
  new: {
    label: "New",
    variant: "outline",
    className: "border-slate-400/40 text-slate-600 dark:text-slate-400",
  },
  contacted: {
    label: "Contacted",
    variant: "outline",
    className: "border-blue-500/40 text-blue-600 dark:text-blue-400",
  },
  qualified: {
    label: "Qualified",
    variant: "outline",
    className: "border-violet-500/40 text-violet-600 dark:text-violet-400",
  },
  proposal: {
    label: "Proposal",
    variant: "outline",
    className: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  },
  negotiation: {
    label: "Negotiation",
    variant: "outline",
    className: "border-orange-500/40 text-orange-600 dark:text-orange-400",
  },
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
