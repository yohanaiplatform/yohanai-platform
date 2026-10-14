// src/lib/dashboard/getDashboardInsights.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Insight } from "@/types/dashboard";
import { PRIORITY } from "@/constants/dashboard";
import { getLeadMetadataString } from "@/lib/crm/getLeads";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFollowUps } from "@/lib/analysis/followUps";
import { resolveFollowUpScope } from "@/lib/analysis/followUpScope";

const FOLLOW_UP_OVERDUE_HOURS = 48;
const FROZEN_LEAD_OVERDUE_DAYS = 30;

/**
 * Satu-satunya insight di panel ini yang dihitung dari data ASLI.
 * "Belum di-follow-up" = metadata->>follow_up_terakhir kosong atau lebih
 * lama dari FOLLOW_UP_OVERDUE_HOURS, untuk lead Hot/Warm (Cold/Closing/
 * Batal tidak mendesak). follow_up_terakhir disimpan sebagai
 * Date.toString() V8 dari Apps Script, di-parse lewat new Date() (bukan
 * dari Postgres, karena PostgREST tidak bisa filter hasil regexp+cast).
 */
async function getFollowUpBacklogInsight(
  supabase: SupabaseClient<Database>
): Promise<Insight> {
  const cutoff = Date.now() - FOLLOW_UP_OVERDUE_HOURS * 60 * 60 * 1000;

  const { data, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("metadata")
    .or(
      "metadata->>status_funnel_awal.ilike.hot,metadata->>status_funnel_awal.ilike.warm"
    )
    .is("deleted_at", null);

  const overdueCount =
    !error && data
      ? data.filter((lead) => {
          const followUpTerakhir = getLeadMetadataString(
            lead.metadata,
            "follow_up_terakhir"
          );
          if (!followUpTerakhir) return true;
          const parsed = new Date(followUpTerakhir).getTime();
          return Number.isNaN(parsed) || parsed < cutoff;
        }).length
      : 0;

  return {
    id: "insight-followup-backlog",
    title: "Follow-up Backlog",
    description:
      overdueCount > 0
        ? `${overdueCount} lead Hot/Warm belum di-follow-up dalam ${FOLLOW_UP_OVERDUE_HOURS} jam terakhir. Klik untuk lihat daftarnya.`
        : "Semua lead Hot/Warm sudah di-follow-up dalam 48 jam terakhir.",
    category: "action",
    priority: overdueCount > 20 ? PRIORITY.HIGH.toLowerCase() as "high" : overdueCount > 0 ? PRIORITY.MEDIUM.toLowerCase() as "medium" : PRIORITY.LOW.toLowerCase() as "low",
    created_at: new Date().toISOString(),
    href: "/crm?temperature=hot,warm",
  };
}

/**
 * Awalnya dicoba pakai Temperature "Closing", TERNYATA SALAH -- dikoreksi
 * Yohan 27 September 2026: lead "Closing" di data ini artinya SUDAH
 * closing/booking (sebagian bahkan sudah akad & menempati rumah), bukan
 * "menuju closing". Diarahkan ulang ke "Cold": lead yang tak pernah
 * tersentuh lagi sejak komunikasi terakhir. Hot/Warm sudah dicakup
 * Follow-up Backlog, jadi Cold pelengkapnya -- volume besar (lihat
 * catatan Batal di getDashboardInsights.ts) sengaja tidak dipangkas,
 * karena itu justru temuan aslinya: pool lead dingin yang belum pernah
 * direaktivasi.
 */
async function getFrozenLeadInsight(
  supabase: SupabaseClient<Database>
): Promise<Insight> {
  const cutoff = Date.now() - FROZEN_LEAD_OVERDUE_DAYS * 24 * 60 * 60 * 1000;

  const { data, error } = await supabase
    .schema("customer")
    .from("leads")
    .select("metadata")
    .ilike("metadata->>status_funnel_awal", "cold")
    .is("deleted_at", null);

  const overdueCount =
    !error && data
      ? data.filter((lead) => {
          const followUpTerakhir = getLeadMetadataString(
            lead.metadata,
            "follow_up_terakhir"
          );
          if (!followUpTerakhir) return true;
          const parsed = new Date(followUpTerakhir).getTime();
          return Number.isNaN(parsed) || parsed < cutoff;
        }).length
      : 0;

  return {
    id: "insight-frozen-leads",
    title: "Lead Beku",
    description:
      overdueCount > 0
        ? `${overdueCount} lead Cold belum tersentuh sejak komunikasi terakhir (lebih dari ${FROZEN_LEAD_OVERDUE_DAYS} hari) -- berpotensi masih bisa diaktifkan lagi. Klik untuk lihat daftarnya.`
        : "Semua lead Cold sudah tersentuh dalam 30 hari terakhir.",
    category: "action",
    priority: overdueCount > 20 ? PRIORITY.HIGH.toLowerCase() as "high" : overdueCount > 0 ? PRIORITY.MEDIUM.toLowerCase() as "medium" : PRIORITY.LOW.toLowerCase() as "low",
    created_at: new Date().toISOString(),
    href: "/crm?temperature=cold",
  };
}

/**
 * Kartu "Lead Perlu Tindak Lanjut" (menggantikan contoh ilustratif "Buyer Behavior Insight", 15 Okt 2026): dihitung dari
 * percakapan WhatsApp 30 hari terakhir. Admin melihat semua lead, akun lain hanya lead miliknya (scope dari sesi login).
 * Gagal membaca = kartu dihilangkan (bukan menampilkan angka palsu).
 */
async function getConversationFollowUpInsight(supabase: SupabaseClient<Database>): Promise<Insight | null> {
  try {
    const scope = await resolveFollowUpScope(supabase);
    if (!scope) return null;
    const { totals } = await getFollowUps(createAdminClient(), { assignedTo: scope.assignedTo });
    const parts: string[] = [];
    if (totals.waiting > 0) parts.push(`${totals.waiting} lead Hot/Warm menunggu balasan`);
    if (totals.stalled > 0) parts.push(`${totals.stalled} lead Hot/Warm sepi lebih dari 5 hari`);
    if (totals.objection > 0) parts.push(`${totals.objection} lead berhenti setelah menyatakan keberatan`);
    return {
      id: "insight-conversation-followup",
      title: "Lead Perlu Tindak Lanjut",
      description:
        parts.length > 0
          ? `${parts.join("; ")}. Klik untuk lihat daftar dan buka lead-nya.`
          : "Tidak ada lead yang menunggu balasan atau sepi dalam percakapan 30 hari terakhir.",
      category: "action",
      priority: totals.waiting > 0 ? "high" : totals.stalled + totals.objection > 0 ? "medium" : "low",
      created_at: new Date().toISOString(),
      href: "/sales#tindak-lanjut",
    };
  } catch {
    return null;
  }
}

export async function getDashboardInsights(
  supabase: SupabaseClient<Database>
): Promise<Insight[]> {
  const [followUpBacklog, frozenLeads, conversationFollowUp] = await Promise.all([
    getFollowUpBacklogInsight(supabase),
    getFrozenLeadInsight(supabase),
    getConversationFollowUpInsight(supabase),
  ]);

  // Hanya data asli: kartu contoh ilustratif "Buyer Behavior Insight" dihapus (digantikan kartu tindak lanjut percakapan).
  return [conversationFollowUp, followUpBacklog, frozenLeads].filter((i): i is Insight => i !== null);
}
