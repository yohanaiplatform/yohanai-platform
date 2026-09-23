// src/app/(dashboard)/crm/page.tsx

import { SectionCard } from "@/components/ui/section-card";
import { LeadList } from "@/components/crm/LeadList";
import { LeadListPagination } from "@/components/crm/LeadListPagination";
import { LeadListFilters } from "@/components/crm/LeadListFilters";
import { getLeads, LEADS_PAGE_SIZE, type LeadFilters } from "@/lib/crm/getLeads";
import { createClient } from "@/lib/supabase/server";

interface CRMPageProps {
  searchParams: Promise<{
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    kategori?: string;
  }>;
}

export default async function CRMPage({ searchParams }: CRMPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const filters: LeadFilters = {
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    kategori: params.kategori || undefined,
  };

  const supabase = await createClient();
  const { data, count, error } = await getLeads(supabase, page, filters);

  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="CRM"
        description="Lead dari Google Form dan channel lain, tersimpan di database."
      >
        <div className="space-y-4">
          <LeadListFilters
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            kategori={filters.kategori}
          />
          <LeadList data={data} error={error} />
          {!error && (
            <LeadListPagination
              page={page}
              pageSize={LEADS_PAGE_SIZE}
              totalCount={count}
              filters={filters}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
