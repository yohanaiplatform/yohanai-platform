// src/components/dashboard/RecentLeads.tsx

import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { getLeadMetadataString } from "@/lib/crm/getLeads";
import type { RecentLead } from "@/types/dashboard";

interface RecentLeadsProps {
  data: RecentLead[] | null;
  error: boolean;
}

export function RecentLeads({ data, error }: RecentLeadsProps) {
  if (error) {
    return (
      <SectionCard
        title="Recent Leads"
        description="Latest leads captured in the system"
      >
        <EmptyState
          title="Error"
          description="Unable to load recent leads."
        />
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard
        title="Recent Leads"
        description="Latest leads captured in the system"
      >
        <EmptyState
          title="No Leads"
          description="No recent leads found."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Recent Leads"
      description="Latest leads captured in the system"
    >
      <div className="space-y-4">
        {data.map((lead) => {
          const nama =
            `${lead.first_name} ${lead.last_name}`.trim() || "Unknown Lead";
          const kategori = getLeadMetadataString(lead.metadata, "kategori");

          return (
            <div
              key={lead.id}
              className="flex flex-col justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">{nama}</p>

                <p className="text-sm text-muted-foreground">
                  {lead.email ?? lead.phone ?? "No contact information"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {kategori ?? "Kategori belum diketahui"}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                <WhatsAppButton phone={lead.phone} nama={nama} />

                <p className="text-xs text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}