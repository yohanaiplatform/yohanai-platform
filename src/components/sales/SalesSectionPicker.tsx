"use client";

// src/components/sales/SalesSectionPicker.tsx

import { useState } from "react";
import { ArrowLeft, Flame, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HotLeadFollowUpList } from "@/components/sales/HotLeadFollowUpList";
import { ClosingLeadCard } from "@/components/sales/ClosingLeadCard";
import type { ClosingLead, FollowUpBucket } from "@/lib/sales/getSalesData";

interface SalesSectionPickerProps {
  hot: FollowUpBucket;
  warm: FollowUpBucket;
  followUpError: boolean;
  closingLeads: ClosingLead[];
  closingError: boolean;
}

type Section = "followup" | "closing" | null;

/**
 * Halaman Sales punya 2 topik berbeda (follow-up vs closing) -- sebelumnya
 * keduanya langsung dirender penuh dari atas ke bawah, bikin scroll panjang
 * walau user cuma mau kerjakan satu topik. Sekarang user pilih kartu dulu,
 * baru topik itu yang ditampilkan.
 */
export function SalesSectionPicker({
  hot,
  warm,
  followUpError,
  closingLeads,
  closingError,
}: SalesSectionPickerProps) {
  const [section, setSection] = useState<Section>(null);

  if (section === null) {
    const followUpTotal = hot.totalCount + warm.totalCount;

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSection("followup")}
          className="flex flex-col items-start gap-2 rounded-2xl border border-border p-5 text-left transition-colors hover:border-brand hover:bg-muted/40"
        >
          <Flame className="h-6 w-6 text-red-500" />
          <span className="text-lg font-semibold">Follow-up Hot Lead</span>
          <span className="text-sm text-muted-foreground">
            Lead Hot/Warm yang belum di-follow-up dalam 48 jam terakhir.
          </span>
          <span className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            {followUpTotal} lead butuh follow-up
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSection("closing")}
          className="flex flex-col items-start gap-2 rounded-2xl border border-border p-5 text-left transition-colors hover:border-brand hover:bg-muted/40"
        >
          <KeyRound className="h-6 w-6 text-blue-500" />
          <span className="text-lg font-semibold">Proses Closing</span>
          <span className="text-sm text-muted-foreground">
            Checklist tiap lead yang sudah closing -- dari PPJB sampai BAST Kunci.
          </span>
          <span className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            {closingLeads.length} lead closing
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setSection(null)}
        className="-ml-2 gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Button>

      {section === "followup" && (
        <SectionCard
          title="Follow-up Hot Lead"
          description="Lead Hot/Warm yang belum di-follow-up dalam 48 jam terakhir."
        >
          <div className="space-y-6">
            <HotLeadFollowUpList temperature="hot" data={hot.data} totalCount={hot.totalCount} error={followUpError} />
            <HotLeadFollowUpList temperature="warm" data={warm.data} totalCount={warm.totalCount} error={followUpError} />
          </div>
        </SectionCard>
      )}

      {section === "closing" && (
        <SectionCard
          title="Proses Closing"
          description="Checklist tiap lead yang sudah closing -- dari PPJB sampai BAST Kunci."
        >
          {closingError ? (
            <EmptyState title="Error" description="Gagal memuat daftar closing." />
          ) : closingLeads.length === 0 ? (
            <EmptyState title="Belum Ada" description="Belum ada lead dengan Temperature Closing." />
          ) : (
            <div className="space-y-4">
              {closingLeads.map((lead) => (
                <ClosingLeadCard
                  key={lead.id}
                  leadId={lead.id}
                  leadSlug={lead.slug}
                  nama={`${lead.first_name} ${lead.last_name}`.trim() || "Lead"}
                  phone={lead.phone}
                  metadata={lead.metadata}
                  checklist={lead.checklist}
                />
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
