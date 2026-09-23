// src/app/(dashboard)/crm/page.tsx

import { SectionCard } from "@/components/ui/section-card";
import { LeadList } from "@/components/crm/LeadList";
import { LeadListPagination } from "@/components/crm/LeadListPagination";
import { getLeads, LEADS_PAGE_SIZE } from "@/lib/crm/getLeads";
import { createClient } from "@/lib/supabase/server";

interface CRMPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CRMPage({ searchParams }: CRMPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { data, count, error } = await getLeads(supabase, page);

  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="CRM"
        description="Lead dari Google Form dan channel lain, tersimpan di database."
      >
        <LeadList data={data} error={error} />
        {!error && (
          <LeadListPagination
            page={page}
            pageSize={LEADS_PAGE_SIZE}
            totalCount={count}
          />
        )}
      </SectionCard>
    </div>
  );
}
