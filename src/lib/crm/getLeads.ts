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
  /** Nilai persis metadata->>sumber_informasi, lihat LEAD_SUMBER_OPTIONS. */
  sumber?: string;
  /**
   * hot | warm | cold | closing | batal -- dari metadata->>status_funnel_awal,
   * dicocokkan tanpa peduli huruf besar/kecil. Bisa lebih dari satu,
   * dipisah koma (mis. "hot,warm").
   */
  temperature?: string;
  /** Cari lead berdasarkan nama (substring) atau nomor HP (digit saja). */
  search?: string;
}

/**
 * Query dasar customer.leads dengan filter LeadFilters diterapkan --
 * dipakai getLeads() (paginated, buat Lead List) dan getAllLeadsForExport()
 * (tanpa batas, buat export CSV) supaya logika filter cuma didefinisikan
 * sekali, tidak drift antara dua tempat.
 */
function buildFilteredLeadsQuery(
  supabase: SupabaseClient<Database>,
  filters: LeadFilters
) {
  let query = supabase
    .schema("customer")
    .from("leads")
    .select(
      "id, first_name, last_name, email, phone, status, assigned_to, created_at, metadata, lead_source_id",
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
  if (filters.sumber) {
    query = query.eq("metadata->>sumber_informasi", filters.sumber);
  }
  if (filters.temperature) {
    const values = filters.temperature.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length === 1) {
      query = query.ilike("metadata->>status_funnel_awal", values[0]);
    } else if (values.length > 1) {
      query = query.or(
        values.map((v) => `metadata->>status_funnel_awal.ilike.${v}`).join(",")
      );
    }
  }
  if (filters.search) {
    // Buang karakter yang berarti khusus di sintaks .or() PostgREST
    // (koma, kurung) supaya nama dengan karakter itu tidak merusak query.
    const namePattern = `%${filters.search.trim().replace(/[%,()]/g, "")}%`;
    const digits = filters.search.replace(/[^0-9]/g, "");
    const phoneDigits = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;

    // Selain nama/HP, ikut cari di field teks bebas -- ini tempat kata
    // kunci lokasi (mis. "Sungai Raya Dalam", "UNTAN") biasanya muncul,
    // bukan di kolom terstruktur seperti Kategori.
    const orParts = [
      `first_name.ilike.${namePattern}`,
      `last_name.ilike.${namePattern}`,
      `metadata->>minat_unit_lokasi.ilike.${namePattern}`,
      `metadata->>permintaan.ilike.${namePattern}`,
      `metadata->>komentar.ilike.${namePattern}`,
    ];
    if (phoneDigits) {
      orParts.push(`phone.ilike.%${phoneDigits}%`);
    }
    query = query.or(orParts.join(","));
  }

  return query;
}

export async function getLeads(
  supabase: SupabaseClient<Database>,
  page: number,
  filters: LeadFilters = {}
): Promise<GetLeadsResult> {
  const from = (page - 1) * LEADS_PAGE_SIZE;
  const to = from + LEADS_PAGE_SIZE - 1;

  const [leadsRes, sourcesRes] = await Promise.all([
    buildFilteredLeadsQuery(supabase, filters)
      .order("created_at", { ascending: false })
      .range(from, to),
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

export interface LeadExportRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  metadata: Json;
  lead_source_name: string | null;
}

const EXPORT_BATCH_SIZE = 1000;

/**
 * Sama seperti getLeads() tapi tanpa pagination -- dipakai export CSV
 * yang butuh SEMUA baris sesuai filter, bukan satu halaman. Query
 * PostgREST punya batas baris per request (default 1000), jadi di-loop
 * per batch sampai habis alih-alih asumsi satu request cukup.
 */
export async function getAllLeadsForExport(
  supabase: SupabaseClient<Database>,
  filters: LeadFilters = {}
): Promise<{ data: LeadExportRow[]; error: boolean }> {
  const { data: sources, error: sourcesError } = await supabase
    .schema("customer")
    .from("lead_sources")
    .select("id, name");

  if (sourcesError) {
    return { data: [], error: true };
  }

  const sourceNameById = new Map(sources.map((source) => [source.id, source.name]));

  const rows: LeadExportRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildFilteredLeadsQuery(supabase, filters)
      .order("created_at", { ascending: false })
      .range(from, from + EXPORT_BATCH_SIZE - 1);

    if (error) {
      return { data: [], error: true };
    }

    rows.push(
      ...data.map((lead) => ({
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        assigned_to: lead.assigned_to,
        created_at: lead.created_at,
        metadata: lead.metadata,
        lead_source_name: lead.lead_source_id
          ? (sourceNameById.get(lead.lead_source_id) ?? null)
          : null,
      }))
    );

    if (data.length < EXPORT_BATCH_SIZE) break;
    from += EXPORT_BATCH_SIZE;
  }

  return { data: rows, error: false };
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
