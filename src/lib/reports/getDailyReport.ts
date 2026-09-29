// src/lib/reports/getDailyReport.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface DailyReport {
  generatedAt: string;
  /** Tanggal kalender WIB laporan ini (YYYY-MM-DD) -- dipakai buat link "lead baru hari ini" di email. */
  reportDateWIB: string;
  leads: {
    total: number;
    newToday: number;
    hot: number;
    warm: number;
    cold: number;
    closing: number;
    batal: number;
    followUpBacklog: number;
    frozenLeads: number;
  };
  listings: {
    total: number;
    newToday: number;
    hidden: number;
    available: number;
    booked: number;
    sold: number;
    hold: number;
  };
  chat: {
    conversationsTotal: number;
    messagesToday: number;
    messagesInToday: number;
    messagesOutToday: number;
    activeConversationsToday: number;
  };
}

const FOLLOW_UP_OVERDUE_HOURS = 48;
const FROZEN_LEAD_OVERDUE_DAYS = 30;

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Awal hari ini menurut kalender WIB (UTC+7, tidak kenal DST), bukan waktu
 * lokal server. Vercel function jalan di UTC -- kalau dulu pakai
 * `new Date().setHours(0,0,0,0)`, batas "hari ini" mengikuti tengah malam
 * UTC (07:00 WIB), bukan tengah malam WIB, sehingga "lead baru hari ini"
 * bisa salah hitung sampai 7 jam.
 */
function startOfTodayWIB(): Date {
  const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
  const wibMidnightUTC = Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate());
  return new Date(wibMidnightUTC - WIB_OFFSET_MS);
}

function startOfTodayISO(): string {
  return startOfTodayWIB().toISOString();
}

function todayDateWIB(): string {
  const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
  return wibNow.toISOString().slice(0, 10);
}

/**
 * Dipakai lewat createAdminClient() (service-role) -- report ini punya
 * angka lintas semua agent (bukan cuma milik pemanggil), jadi tidak bisa
 * lewat client session biasa yang tunduk RLS leads_owner_or_admin/
 * listings_owner_or_admin.
 *
 * "Relevan" untuk sekarang: lead, listing, chat -- itu yang sudah ada
 * datanya. Token AI, AI crawler, visitor listing/foto, download foto/video
 * SENGAJA belum masuk sini -- belum ada instrumentasi tracking-nya sama
 * sekali di codebase, beda kelas pekerjaan dari agregasi angka yang sudah
 * ada. Lihat docs/status.mdx Task 019/020 untuk rencana lanjutannya.
 */
export async function getDailyReport(supabase: SupabaseClient<Database>): Promise<DailyReport> {
  const todayStart = startOfTodayISO();
  const followUpCutoff = new Date(Date.now() - FOLLOW_UP_OVERDUE_HOURS * 60 * 60 * 1000).toISOString();
  const frozenCutoff = new Date(Date.now() - FROZEN_LEAD_OVERDUE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    leadsTotal,
    leadsToday,
    leadsHot,
    leadsWarm,
    leadsCold,
    leadsClosing,
    leadsBatal,
    listingsAll,
    listingsToday,
    conversationsTotal,
    messagesToday,
  ] = await Promise.all([
    supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart)
      .is("deleted_at", null),
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "hot")
      .is("deleted_at", null),
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "warm")
      .is("deleted_at", null),
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "cold")
      .is("deleted_at", null),
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "closing")
      .is("deleted_at", null),
    supabase
      .schema("customer")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .ilike("metadata->>status_funnel_awal", "batal")
      .is("deleted_at", null),
    supabase.schema("property").from("listings").select("metadata, created_at").is("deleted_at", null),
    supabase
      .schema("property")
      .from("listings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart)
      .is("deleted_at", null),
    supabase.schema("chat").from("conversations").select("id", { count: "exact", head: true }),
    supabase
      .schema("chat")
      .from("messages")
      .select("sender_type, conversation_id")
      .gte("created_at", todayStart)
      .is("deleted_at", null),
  ]);

  // Follow-up Backlog & Lead Beku -- angka yang sama seperti kartu AI
  // Intelligence di dashboard (getDashboardInsights.ts), dihitung ulang di
  // sini karena butuh field metadata mentah (count-only query di atas tidak
  // cukup untuk logic overdue).
  const [hotWarmLeads, coldLeads] = await Promise.all([
    supabase
      .schema("customer")
      .from("leads")
      .select("metadata")
      .or("metadata->>status_funnel_awal.ilike.hot,metadata->>status_funnel_awal.ilike.warm")
      .is("deleted_at", null),
    supabase
      .schema("customer")
      .from("leads")
      .select("metadata")
      .ilike("metadata->>status_funnel_awal", "cold")
      .is("deleted_at", null),
  ]);

  function isOverdue(metadata: unknown, cutoffISO: string): boolean {
    const followUp =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>).follow_up_terakhir
        : null;
    if (!followUp || typeof followUp !== "string") return true;
    const parsed = new Date(followUp).getTime();
    return Number.isNaN(parsed) || parsed < new Date(cutoffISO).getTime();
  }

  const followUpBacklog = (hotWarmLeads.data ?? []).filter((l) => isOverdue(l.metadata, followUpCutoff)).length;
  const frozenLeads = (coldLeads.data ?? []).filter((l) => isOverdue(l.metadata, frozenCutoff)).length;

  const listingRows = listingsAll.data ?? [];
  const listingStats = { available: 0, booked: 0, sold: 0, hold: 0, hidden: 0 };
  for (const row of listingRows) {
    const metadata =
      typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
    const status = metadata.status;
    if (status === "available") listingStats.available += 1;
    else if (status === "booked") listingStats.booked += 1;
    else if (status === "sold") listingStats.sold += 1;
    else if (status === "hold") listingStats.hold += 1;
    if (metadata.hidden === true) listingStats.hidden += 1;
  }

  const messageRows = messagesToday.data ?? [];
  const activeConversationsToday = new Set(messageRows.map((m) => m.conversation_id)).size;
  const messagesInToday = messageRows.filter((m) => m.sender_type === "customer").length;
  const messagesOutToday = messageRows.length - messagesInToday;

  return {
    generatedAt: new Date().toISOString(),
    reportDateWIB: todayDateWIB(),
    leads: {
      total: leadsTotal.count ?? 0,
      newToday: leadsToday.count ?? 0,
      hot: leadsHot.count ?? 0,
      warm: leadsWarm.count ?? 0,
      cold: leadsCold.count ?? 0,
      closing: leadsClosing.count ?? 0,
      batal: leadsBatal.count ?? 0,
      followUpBacklog,
      frozenLeads,
    },
    listings: {
      total: listingRows.length,
      newToday: listingsToday.count ?? 0,
      hidden: listingStats.hidden,
      available: listingStats.available,
      booked: listingStats.booked,
      sold: listingStats.sold,
      hold: listingStats.hold,
    },
    chat: {
      conversationsTotal: conversationsTotal.count ?? 0,
      messagesToday: messageRows.length,
      messagesInToday,
      messagesOutToday,
      activeConversationsToday,
    },
  };
}
