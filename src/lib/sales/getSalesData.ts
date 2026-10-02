// src/lib/sales/getSalesData.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { getLeadMetadataString } from "@/lib/crm/getLeads";

const FOLLOW_UP_OVERDUE_HOURS = 48;

interface LeadRow {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  metadata: Json;
  created_at: string;
}

export interface HotFollowUpLead extends LeadRow {
  /** null = belum pernah di-follow-up sama sekali (lebih mendesak dari yang pernah tapi lama). */
  hoursSinceFollowUp: number | null;
}

const HOT_FOLLOW_UP_DISPLAY_LIMIT = 20;

export interface FollowUpBucket {
  data: HotFollowUpLead[];
  totalCount: number;
}

/**
 * Lead Hot/Warm yang belum di-follow-up dalam 48 jam terakhir -- logika
 * sama seperti getFollowUpBacklogInsight() di getDashboardInsights.ts,
 * tapi balikin daftar lead lengkap (bukan cuma hitungan) buat halaman
 * Sales. Hot dan Warm dipisah jadi 2 bucket terpisah (diminta Yohan --
 * dua kategori urgensinya beda) dibatasi masing-masing ke yang paling
 * mendesak (HOT_FOLLOW_UP_DISPLAY_LIMIT) -- data backfill lama sering
 * berjumlah ratusan, merender semuanya sekaligus tidak praktis.
 * totalCount per bucket dipakai buat tautan "lihat semua" ke /crm yang
 * sudah ter-filter per temperature.
 */
export async function getHotFollowUpLeads(
  supabase: SupabaseClient<Database>
): Promise<{ hot: FollowUpBucket; warm: FollowUpBucket; error: boolean }> {
  const cutoff = Date.now() - FOLLOW_UP_OVERDUE_HOURS * 60 * 60 * 1000;
  const empty: FollowUpBucket = { data: [], totalCount: 0 };

  const { data, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("id, slug, first_name, last_name, phone, metadata, created_at")
    .or(
      "metadata->>status_funnel_awal.ilike.hot,metadata->>status_funnel_awal.ilike.warm"
    )
    .is("deleted_at", null);

  if (error || !data) {
    return { hot: empty, warm: empty, error: true };
  }

  const overdue = data
    .map((lead) => {
      const followUpTerakhir = getLeadMetadataString(lead.metadata, "follow_up_terakhir");
      const parsed = followUpTerakhir ? new Date(followUpTerakhir).getTime() : NaN;
      const hoursSinceFollowUp =
        followUpTerakhir && !Number.isNaN(parsed)
          ? Math.floor((Date.now() - parsed) / (60 * 60 * 1000))
          : null;
      const isOverdue = hoursSinceFollowUp === null || parsed < cutoff;
      const temperature = getLeadMetadataString(lead.metadata, "status_funnel_awal")?.toLowerCase() ?? "";
      return { lead, hoursSinceFollowUp, isOverdue, temperature };
    })
    .filter((x) => x.isOverdue);

  function bucket(temperature: "hot" | "warm"): FollowUpBucket {
    const filtered = overdue
      .filter((x) => x.temperature === temperature)
      .sort(
        (a, b) =>
          (b.hoursSinceFollowUp ?? Number.MAX_SAFE_INTEGER) -
          (a.hoursSinceFollowUp ?? Number.MAX_SAFE_INTEGER)
      )
      .map(({ lead, hoursSinceFollowUp }) => ({ ...lead, hoursSinceFollowUp }));

    return { data: filtered.slice(0, HOT_FOLLOW_UP_DISPLAY_LIMIT), totalCount: filtered.length };
  }

  return { hot: bucket("hot"), warm: bucket("warm"), error: false };
}

export interface ClosingChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

/** Progres closing satu lead, disimpan di customer.leads.metadata.closing_checklist (JSONB, tanpa migration baru). */
export interface ClosingChecklist {
  ppjb_signed: boolean;
  berkas_submitted: boolean;
  /** "Kekurangan" dokumen -- daftar bebas, agen tambah/hapus sendiri sesuai kasus per lead. */
  berkas_items: ClosingChecklistItem[];
  /** null = belum dipilih -- checklist Berkas Lengkap tidak diisi otomatis sampai ini dipilih. */
  payment_method: PaymentMethod | null;
  bast_kunci: boolean;
}

export type PaymentMethod = "kpr_subsidi" | "kpr_non_subsidi" | "cash" | "cash_bertahap";

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "kpr_subsidi", label: "KPR Subsidi" },
  { value: "kpr_non_subsidi", label: "KPR Non-Subsidi" },
  { value: "cash", label: "Cash" },
  { value: "cash_bertahap", label: "Cash Bertahap" },
];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "kpr_subsidi" || value === "kpr_non_subsidi" || value === "cash" || value === "cash_bertahap";
}

/** KPR Subsidi punya dokumen paling lengkap -- Non-Subsidi, Cash, dan Cash Bertahap adalah pengurangan dari sini. */
const KPR_SUBSIDI_ITEMS: string[] = [
  "Down Payment (DP)",
  "Fotokopi KTP Pemohon",
  "Fotokopi KTP Suami/Istri (bagi yang sudah menikah)",
  "Surat Keterangan Belum Menikah dari Desa/Lurah (bagi yang belum menikah)",
  "Fotokopi Kartu Keluarga",
  "Fotokopi Akta Nikah / Akta Cerai / Akta Pisah Harta",
  "Fotokopi NPWP / SPT PPh21",
  "Data Keuangan dan/atau Rekening Koran/Tabungan 3 Bulan Terakhir",
  "Pas Foto 3x4 Suami Istri Masing-masing 2 Lembar",
  "Foto Tempat Kerja",
  "Sket Lokasi Tempat Kerja",
  "Materai 6000 Sebanyak 12 Lembar",
  "Registrasi Tapera Mobile",
  "Slip Gaji & Surat Keterangan Kerja Asli (Karyawan)",
  "Fotokopi Surat Izin Praktek/Surat Pengangkatan (Profesional)",
  "Fotokopi Laporan Keuangan Usaha, SIUP, TDP/Akta Perusahaan (Wiraswasta)",
];

/** Sama seperti KPR Subsidi, minus Tapera Mobile dan Surat Keterangan Belum Menikah. */
const KPR_NON_SUBSIDI_ITEMS: string[] = KPR_SUBSIDI_ITEMS.filter(
  (item) => item !== "Registrasi Tapera Mobile" && item !== "Surat Keterangan Belum Menikah dari Desa/Lurah (bagi yang belum menikah)"
);

/** Cash dan Cash Bertahap sama-sama cuma butuh 3 dokumen dasar. */
const CASH_ITEMS: string[] = [
  "Fotokopi KTP Suami/Istri (Menikah)",
  "Fotokopi Kartu Keluarga",
  "Fotokopi NPWP / SPT PPh21",
];

/**
 * Daftar dokumen per metode pembayaran -- sumber: form resmi "Layanan
 * KPR/KPA" Griya Indonesia Real Estate (untuk 2 varian KPR) + aturan
 * internal Yohan (untuk Cash/Cash Bertahap). Dipakai buat mengisi
 * otomatis checklist Berkas Lengkap begitu agen pertama kali membuka
 * detailnya untuk satu lead (list kosong) sesuai metode pembayaran yang
 * sudah dipilih -- agen tinggal centang yang relevan dan hapus yang tidak
 * perlu dari situ.
 */
export const BERKAS_ITEMS_BY_PAYMENT_METHOD: Record<PaymentMethod, string[]> = {
  kpr_subsidi: KPR_SUBSIDI_ITEMS,
  kpr_non_subsidi: KPR_NON_SUBSIDI_ITEMS,
  cash: CASH_ITEMS,
  cash_bertahap: CASH_ITEMS,
};

export const EMPTY_CLOSING_CHECKLIST: ClosingChecklist = {
  ppjb_signed: false,
  berkas_submitted: false,
  berkas_items: [],
  payment_method: null,
  bast_kunci: false,
};

export function getClosingChecklist(metadata: Json): ClosingChecklist {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return EMPTY_CLOSING_CHECKLIST;
  }
  const raw = (metadata as Record<string, Json | undefined>).closing_checklist;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return EMPTY_CLOSING_CHECKLIST;
  }
  const r = raw as Record<string, Json | undefined>;
  const items = Array.isArray(r.berkas_items) ? r.berkas_items : [];

  return {
    ppjb_signed: r.ppjb_signed === true,
    berkas_submitted: r.berkas_submitted === true,
    berkas_items: items
      .filter(
        (item): item is Record<string, Json> =>
          typeof item === "object" && item !== null && !Array.isArray(item)
      )
      .map((item, i) => ({
        id: typeof item.id === "string" ? item.id : `item-${i}`,
        label: typeof item.label === "string" ? item.label : "",
        done: item.done === true,
      })),
    payment_method: isPaymentMethod(r.payment_method) ? r.payment_method : null,
    bast_kunci: r.bast_kunci === true,
  };
}

export interface ClosingLead extends LeadRow {
  checklist: ClosingChecklist;
}

/** Semua lead Temperature "Closing", diurutkan: yang belum sampai BAST Kunci duluan, baru yang sudah selesai. */
export async function getClosingLeads(
  supabase: SupabaseClient<Database>
): Promise<{ data: ClosingLead[]; error: boolean }> {
  const { data, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("id, slug, first_name, last_name, phone, metadata, created_at")
    .ilike("metadata->>status_funnel_awal", "closing")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { data: [], error: true };
  }

  const withChecklist = data.map((lead) => ({
    ...lead,
    checklist: getClosingChecklist(lead.metadata),
  }));

  withChecklist.sort((a, b) => {
    if (a.checklist.bast_kunci !== b.checklist.bast_kunci) {
      return a.checklist.bast_kunci ? 1 : -1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return { data: withChecklist, error: false };
}
