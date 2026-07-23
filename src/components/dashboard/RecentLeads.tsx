// src/components/dashboard/RecentLeads.tsx

import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
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
        {data.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-medium">
                {`${lead.first_name} ${lead.last_name}`.trim() || "Unknown Lead"}
              </p>

              <p className="text-sm text-muted-foreground">
                {lead.email ?? lead.phone ?? "No contact information"}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Source ID: {lead.lead_source_id ?? "-"}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {lead.status}
              </span>

              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}