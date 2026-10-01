// src/lib/property/getListingReport.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { getLeadMetadataString } from "@/lib/crm/getLeads";
import { LEAD_SUMBER_OPTIONS } from "@/constants/crm";

export interface ListingReportLead {
  id: string;
  nama: string;
  keterangan: string;
  phoneMasked: string;
  agentName: string;
  tanggalInput: string;
}

export interface SumberBreakdownRow {
  label: string;
  count: number;
  percent: number;
}

export interface ListingReportResult {
  leads: ListingReportLead[];
  sumberBreakdown: SumberBreakdownRow[];
  totalLeads: number;
  error: boolean;
}

/** Tabel Data Prospek cuma tampilkan N lead paling baru -- laporan harus muat 1 halaman cetak. */
export const DISPLAY_LEAD_LIMIT = 10;

const KETERANGAN_MAX_LENGTH = 60;

/** Samarkan 6 digit terakhir nomor HP -- laporan ini dikirim ke vendor/pemilik listing, bukan dipakai internal. */
export function maskPhone(phone: string | null): string {
  if (!phone) return "-";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length <= 6) return "•".repeat(digits.length);
  return `+${digits.slice(0, -6)}${"•".repeat(6)}`;
}

/** Potong jadi 1 baris -- tabel laporan harus muat 1 halaman cetak, teks panjang bikin baris melebar ke bawah. */
function truncateKeterangan(value: string): string {
  return value.length > KETERANGAN_MAX_LENGTH ? `${value.slice(0, KETERANGAN_MAX_LENGTH - 1)}…` : value;
}

function formatTanggalInput(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface RawLeadRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  metadata: Json;
  assigned_to: string | null;
  created_at: string;
}

/**
 * Lead yang terkait listing ini -- dicocokkan lewat metadata->>kategori
 * (kategoriMatch, dikonfigurasi per listing di halaman laporan) ATAU
 * metadata->>manual_listing_id (override manual dari Lead Detail, buat
 * lead yang kategorinya terlalu umum, mis. "Kons. Cari Rumah Murah").
 * Tidak ada relasi FK langsung antara customer.leads dan property.listings
 * di database -- dua query terpisah lalu digabung di sini supaya tidak
 * bergantung pada sintaks .or() PostgREST yang rawan patah kalau nilai
 * kategori mengandung spasi/tanda baca.
 */
const REPORT_BATCH_SIZE = 1000;
const REPORT_SELECT = "id, first_name, last_name, phone, metadata, assigned_to, created_at";

/**
 * PostgREST membatasi 1000 baris per request secara default -- tanpa loop
 * .range() ini, listing dengan kategori yang cocok ke ribuan lead lama
 * (mis. "Calon Konsumen Kapur Mas") diam-diam terpotong ke 1000 baris
 * pertama tanpa peringatan apa pun. Ketemu saat testing manual: laporan
 * sempat nampilkan persis "1000 lead" -- angka bulat yang mencurigakan.
 */
async function fetchByKategori(
  supabase: SupabaseClient<Database>,
  kategoriMatch: string[],
  dateFromISO: string,
  dateToISO: string
): Promise<{ data: RawLeadRow[]; error: boolean }> {
  const rows: RawLeadRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .schema("customer")
      .from("leads")
      .select(REPORT_SELECT)
      .in("metadata->>kategori", kategoriMatch)
      .gte("created_at", dateFromISO)
      .lte("created_at", dateToISO)
      .is("deleted_at", null)
      .range(from, from + REPORT_BATCH_SIZE - 1);

    if (error) return { data: [], error: true };
    rows.push(...data);
    if (data.length < REPORT_BATCH_SIZE) break;
    from += REPORT_BATCH_SIZE;
  }

  return { data: rows, error: false };
}

async function fetchByManualLink(
  supabase: SupabaseClient<Database>,
  listingId: string,
  dateFromISO: string,
  dateToISO: string
): Promise<{ data: RawLeadRow[]; error: boolean }> {
  const rows: RawLeadRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .schema("customer")
      .from("leads")
      .select(REPORT_SELECT)
      .eq("metadata->>manual_listing_id", listingId)
      .gte("created_at", dateFromISO)
      .lte("created_at", dateToISO)
      .is("deleted_at", null)
      .range(from, from + REPORT_BATCH_SIZE - 1);

    if (error) return { data: [], error: true };
    rows.push(...data);
    if (data.length < REPORT_BATCH_SIZE) break;
    from += REPORT_BATCH_SIZE;
  }

  return { data: rows, error: false };
}

export async function getListingReport(
  supabase: SupabaseClient<Database>,
  listingId: string,
  kategoriMatch: string[],
  dateFromISO: string,
  dateToISO: string
): Promise<ListingReportResult> {
  const [byKategoriRes, byManualRes] = await Promise.all([
    kategoriMatch.length > 0
      ? fetchByKategori(supabase, kategoriMatch, dateFromISO, dateToISO)
      : Promise.resolve({ data: [] as RawLeadRow[], error: false }),
    fetchByManualLink(supabase, listingId, dateFromISO, dateToISO),
  ]);

  if (byKategoriRes.error || byManualRes.error) {
    return { leads: [], sumberBreakdown: [], totalLeads: 0, error: true };
  }

  const merged = new Map<string, RawLeadRow>();
  for (const row of [...byKategoriRes.data, ...byManualRes.data]) {
    merged.set(row.id, row);
  }
  const rows = Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Tabel Data Prospek cuma tampilkan N lead TERBARU (space terbatas di 1
  // halaman laporan) -- tapi Sumber Informasi & totalLeads tetap dihitung
  // dari SEMUA lead yang cocok di periode itu, bukan cuma yang ditampilkan.
  const displayRows = rows.slice(0, DISPLAY_LEAD_LIMIT);

  const assignedIds = Array.from(
    new Set(displayRows.map((r) => r.assigned_to).filter((id): id is string => Boolean(id)))
  );
  const agentNameById = new Map<string, string>();
  if (assignedIds.length > 0) {
    const { data: profiles } = await supabase
      .schema("auth_ext")
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", assignedIds);
    for (const p of profiles ?? []) {
      const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
      if (name) agentNameById.set(p.user_id, name);
    }
  }

  const leads: ListingReportLead[] = displayRows.map((row) => {
    const nama = `${row.first_name} ${row.last_name}`.trim() || "Lead";
    const keterangan =
      getLeadMetadataString(row.metadata, "komentar") ??
      getLeadMetadataString(row.metadata, "permintaan") ??
      getLeadMetadataString(row.metadata, "minat_unit_lokasi") ??
      "-";

    return {
      id: row.id,
      nama,
      keterangan: truncateKeterangan(keterangan),
      phoneMasked: maskPhone(row.phone),
      agentName: row.assigned_to ? (agentNameById.get(row.assigned_to) ?? "-") : "-",
      tanggalInput: formatTanggalInput(row.created_at),
    };
  });

  const totalLeads = rows.length;
  const sumberCounts = new Map<string, number>();
  for (const option of LEAD_SUMBER_OPTIONS) {
    sumberCounts.set(option, 0);
  }
  let tidakDiisi = 0;
  for (const row of rows) {
    const sumber = getLeadMetadataString(row.metadata, "sumber_informasi");
    if (sumber && sumberCounts.has(sumber)) {
      sumberCounts.set(sumber, (sumberCounts.get(sumber) ?? 0) + 1);
    } else {
      tidakDiisi += 1;
    }
  }

  const sumberBreakdown: SumberBreakdownRow[] = [
    ...Array.from(sumberCounts.entries()).map(([label, count]) => ({
      label,
      count,
      percent: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    })),
    {
      label: "Tidak Diisi",
      count: tidakDiisi,
      percent: totalLeads > 0 ? Math.round((tidakDiisi / totalLeads) * 100) : 0,
    },
  ];

  return { leads, sumberBreakdown, totalLeads, error: false };
}
