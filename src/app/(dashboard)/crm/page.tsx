// src/app/(dashboard)/crm/page.tsx

import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadList } from "@/components/crm/LeadList";
import { LeadListPagination } from "@/components/crm/LeadListPagination";
import { LeadListFilters } from "@/components/crm/LeadListFilters";
import { getLeads, LEADS_PAGE_SIZE, type LeadFilters } from "@/lib/crm/getLeads";
import { createClient } from "@/lib/supabase/server";
import { getCrmDictionary } from "@/lib/i18n/getLocale";

interface CRMPageProps {
  searchParams: Promise<{
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    kategori?: string;
    sumber?: string;
    temperature?: string;
    search?: string;
  }>;
}

export default async function CRMPage({ searchParams }: CRMPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const t = await getCrmDictionary();

  const filters: LeadFilters = {
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    kategori: params.kategori || undefined,
    sumber: params.sumber || undefined,
    temperature: params.temperature || undefined,
    search: params.search || undefined,
  };

  const supabase = await createClient();
  const { data, count, error } = await getLeads(supabase, page, filters);

  const exportParams = new URLSearchParams();
  if (filters.dateFrom) exportParams.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) exportParams.set("dateTo", filters.dateTo);
  if (filters.kategori) exportParams.set("kategori", filters.kategori);
  if (filters.sumber) exportParams.set("sumber", filters.sumber);
  if (filters.temperature) exportParams.set("temperature", filters.temperature);
  if (filters.search) exportParams.set("search", filters.search);
  const exportHref = `/api/leads/export${exportParams.size > 0 ? `?${exportParams}` : ""}`;

  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title={t.list.title}
        description={t.list.description}
        action={
          <div className="flex items-center gap-2">
            <a href={exportHref}>
              <Button size="sm" variant="outline">
                {t.list.exportCsv}
              </Button>
            </a>
            <Link href="/crm/new">
              <Button size="sm">{t.list.addLead}</Button>
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          {filters.temperature && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t.list.activeFilter}</span>
              {filters.temperature.split(",").map((temp) => (
                <Badge key={temp} variant="secondary" className="capitalize">
                  {temp.trim()}
                </Badge>
              ))}
              <Link
                href="/crm"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t.list.clearFilter}
              </Link>
            </div>
          )}

          <LeadListFilters
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            kategori={filters.kategori}
            sumber={filters.sumber}
            temperature={filters.temperature}
            search={filters.search}
            t={t}
          />
          <LeadList data={data} error={error} t={t} />
          {!error && (
            <LeadListPagination
              page={page}
              pageSize={LEADS_PAGE_SIZE}
              totalCount={count}
              filters={filters}
              t={t}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
