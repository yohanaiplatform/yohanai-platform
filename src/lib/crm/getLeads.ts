// src/lib/crm/getLeads.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export const LEADS_PAGE_SIZE = 25;

export interface LeadListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  metadata: Json;
  lead_source_name: string | null;
}

export interface GetLeadsResult {
  data: LeadListItem[] | null;
  count: number;
  error: boolean;
}

export interface LeadFilters {
  /** Tanggal awal, format YYYY-MM-DD (dari input type=date). */
  dateFrom?: string;
  /** Tanggal akhir, format YYYY-MM-DD (dari input type=date), inklusif. */
  dateTo?: string;
  /** Nilai persis metadata->>kategori, lihat LEAD_KATEGORI_OPTIONS. */
  kategori?: string;
  /** hot | warm | cold | closing | batal -- dari metadata->>status_funnel_awal, dicocokkan tanpa peduli huruf besar/kecil. */
  temperature?: string;
}

export async function getLeads(
  supabase: SupabaseClient<Database>,
  page: number,
  filters: LeadFilters = {}
): Promise<GetLeadsResult> {
  const from = (page - 1) * LEADS_PAGE_SIZE;
  const to = from + LEADS_PAGE_SIZE - 1;

  let query = supabase
    .schema("customer")
    .from("leads")
    .select(
      "id, first_name, last_name, email, phone, status, created_at, metadata, lead_source_id",
      { count: "exact" }
    )
    .is("deleted_at", null);

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }
  if (filters.kategori) {
    query = query.eq("metadata->>kategori", filters.kategori);
  }
  if (filters.temperature) {
    query = query.ilike("metadata->>status_funnel_awal", filters.temperature);
  }

  const [leadsRes, sourcesRes] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    supabase.schema("customer").from("lead_sources").select("id, name"),
  ]);

  if (leadsRes.error || sourcesRes.error) {
    return { data: null, count: 0, error: true };
  }

  const sourceNameById = new Map(
    sourcesRes.data.map((source) => [source.id, source.name])
  );

  return {
    data: leadsRes.data.map((lead) => ({
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      created_at: lead.created_at,
      metadata: lead.metadata,
      lead_source_name: lead.lead_source_id
        ? (sourceNameById.get(lead.lead_source_id) ?? null)
        : null,
    })),
    count: leadsRes.count ?? 0,
    error: false,
  };
}

export function getLeadMetadataString(
  metadata: Json,
  key: string
): string | null {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, Json | undefined>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
