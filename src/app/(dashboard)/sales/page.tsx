// src/app/(dashboard)/sales/page.tsx
import { createClient } from "@/lib/supabase/server";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getHotFollowUpLeads, getClosingLeads } from "@/lib/sales/getSalesData";
import { HotLeadFollowUpList } from "@/components/sales/HotLeadFollowUpList";
import { ClosingLeadCard } from "@/components/sales/ClosingLeadCard";

export default async function SalesPage() {
  const supabase = await createClient();

  const [followUps, closingLeads] = await Promise.all([
    getHotFollowUpLeads(supabase),
    getClosingLeads(supabase),
  ]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">
          Follow-up lead prioritas dan proses closing sampai serah terima kunci.
        </p>
      </header>

      <SectionCard
        title="Follow-up Hot Lead"
        description="Lead Hot/Warm yang belum di-follow-up dalam 48 jam terakhir."
      >
        <HotLeadFollowUpList
          data={followUps.data}
          totalCount={followUps.totalCount}
          error={followUps.error}
        />
      </SectionCard>

      <SectionCard
        title="Proses Closing"
        description="Checklist tiap lead yang sudah closing -- dari PPJB sampai BAST Kunci."
      >
        {closingLeads.error ? (
          <EmptyState title="Error" description="Gagal memuat daftar closing." />
        ) : closingLeads.data.length === 0 ? (
          <EmptyState title="Belum Ada" description="Belum ada lead dengan Temperature Closing." />
        ) : (
          <div className="space-y-4">
            {closingLeads.data.map((lead) => (
              <ClosingLeadCard
                key={lead.id}
                leadId={lead.id}
                nama={`${lead.first_name} ${lead.last_name}`.trim() || "Lead"}
                phone={lead.phone}
                metadata={lead.metadata}
                checklist={lead.checklist}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
