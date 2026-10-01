// src/lib/sales/getSalesData.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { getLeadMetadataString } from "@/lib/crm/getLeads";

const FOLLOW_UP_OVERDUE_HOURS = 48;

interface LeadRow {
  id: string;
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

/**
 * Lead Hot/Warm yang belum di-follow-up dalam 48 jam terakhir -- logika
 * sama seperti getFollowUpBacklogInsight() di getDashboardInsights.ts,
 * tapi balikin daftar lead lengkap (bukan cuma hitungan) buat halaman
 * Sales. Dibatasi ke yang paling mendesak (HOT_FOLLOW_UP_DISPLAY_LIMIT) --
 * data backfill lama sering berjumlah ratusan, merender semuanya sekaligus
 * di satu halaman tidak praktis. totalCount dipakai buat tautan "lihat
 * semua" ke /crm yang sudah ter-filter.
 */
export async function getHotFollowUpLeads(
  supabase: SupabaseClient<Database>
): Promise<{ data: HotFollowUpLead[]; totalCount: number; error: boolean }> {
  const cutoff = Date.now() - FOLLOW_UP_OVERDUE_HOURS * 60 * 60 * 1000;

  const { data, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("id, first_name, last_name, phone, metadata, created_at")
    .or(
      "metadata->>status_funnel_awal.ilike.hot,metadata->>status_funnel_awal.ilike.warm"
    )
    .is("deleted_at", null);

  if (error || !data) {
    return { data: [], totalCount: 0, error: true };
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
      return { lead, hoursSinceFollowUp, isOverdue };
    })
    .filter((x) => x.isOverdue)
    .sort(
      (a, b) =>
        (b.hoursSinceFollowUp ?? Number.MAX_SAFE_INTEGER) -
        (a.hoursSinceFollowUp ?? Number.MAX_SAFE_INTEGER)
    )
    .map(({ lead, hoursSinceFollowUp }) => ({ ...lead, hoursSinceFollowUp }));

  return {
    data: overdue.slice(0, HOT_FOLLOW_UP_DISPLAY_LIMIT),
    totalCount: overdue.length,
    error: false,
  };
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
  is_kpr: boolean;
  bast_kunci: boolean;
}

export const EMPTY_CLOSING_CHECKLIST: ClosingChecklist = {
  ppjb_signed: false,
  berkas_submitted: false,
  berkas_items: [],
  is_kpr: false,
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
    is_kpr: r.is_kpr === true,
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
    .select("id, first_name, last_name, phone, metadata, created_at")
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
