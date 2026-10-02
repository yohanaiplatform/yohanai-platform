// src/components/sales/HotLeadFollowUpList.tsx

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import type { HotFollowUpLead } from "@/lib/sales/getSalesData";

interface HotLeadFollowUpListProps {
  temperature: "hot" | "warm";
  data: HotFollowUpLead[];
  totalCount: number;
  error: boolean;
}

export function HotLeadFollowUpList({ temperature, data, totalCount, error }: HotLeadFollowUpListProps) {
  const label = temperature === "hot" ? "Hot" : "Warm";
  const badgeClass =
    temperature === "hot"
      ? "border-red-500/40 text-red-600 dark:text-red-400"
      : "border-amber-500/40 text-amber-600 dark:text-amber-400";

  if (error) {
    return <EmptyState title="Error" description="Gagal memuat daftar follow-up." />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="Semua Beres"
        description={`Tidak ada lead ${label} yang butuh follow-up saat ini.`}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={badgeClass}>
          {label}
        </Badge>
        <span className="text-xs text-muted-foreground">{totalCount} lead</span>
      </div>

      {data.map((lead) => {
        const nama = `${lead.first_name} ${lead.last_name}`.trim() || "Lead";

        return (
          <div
            key={lead.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div>
              <Link href={`/crm/${lead.slug}`} className="font-medium hover:underline">
                {nama}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {lead.hoursSinceFollowUp === null
                  ? "Belum pernah di-follow-up"
                  : `Terakhir di-follow-up ${lead.hoursSinceFollowUp} jam lalu`}
              </p>
            </div>
            <WhatsAppButton phone={lead.phone} nama={nama} />
          </div>
        );
      })}

      {totalCount > data.length && (
        <p className="pt-1 text-sm text-muted-foreground">
          Menampilkan {data.length} dari {totalCount} lead {label} paling mendesak --{" "}
          <Link href={`/crm?temperature=${temperature}`} className="text-primary hover:underline">
            lihat semua di CRM
          </Link>
          .
        </p>
      )}
    </div>
  );
}
