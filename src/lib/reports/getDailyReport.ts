// src/lib/reports/getDailyReport.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getAiAgentUsage, type AiAgentUsage } from "@/lib/reports/getAiAgentUsage";

export interface DailyReport {
  generatedAt: string;
  /** Tanggal kalender WIB yang DIRANGKUM laporan ini (YYYY-MM-DD) -- yaitu KEMARIN relatif ke saat laporan dikirim (cron 07:00 WIB), bukan hari pengiriman. Dipakai buat dateline email & link "lead baru". */
  reportDateWIB: string;
  /** true kalau laporan ini agregat semua agent (admin/super_admin), false kalau di-scope ke satu user. */
  isAggregate: boolean;
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
  aiAgent: AiAgentUsage;
}

export interface GetDailyReportOptions {
  /**
   * null (default) = agregat semua data (admin/super_admin).
   * UUID user = di-scope ke assigned_to = userId (pola sama seperti
   * leads_owner_or_admin/listings_owner_or_admin), untuk laporan personal
   * per agent non-admin.
   */
  assignedTo?: string | null;
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

export interface ReportDayWindow {
  /** Awal hari yang dilaporkan (WIB), ISO string -- batas bawah inklusif. */
  startISO: string;
  /** Awal hari SETELAHNYA (WIB), ISO string -- batas atas eksklusif. */
  endISO: string;
  /** Tanggal kalender (WIB) hari yang dilaporkan, YYYY-MM-DD. */
  dateWIB: string;
}

/**
 * Jendela SATU HARI PENUH yang dilaporkan -- hari KEMARIN (WIB), bukan "sejak
 * tengah malam sampai sekarang" di hari laporan dikirim. Cron jalan 07:00 WIB
 * tiap hari (lihat .github/workflows/daily-report.yml) -- kalau batas
 * bawahnya "hari ini 00:00 WIB", datanya cuma kebagian 7 jam (00:00-07:00),
 * nyaris kosong. Ketemu & diperbaiki 1 Oktober 2026 atas laporan Yohan.
 * Dipakai Daily Report, Platform Report, dan getAiAgentUsage.ts supaya
 * konsisten semua merangkum hari yang sama.
 */
export function getReportDayWindow(): ReportDayWindow {
  const startOfToday = startOfTodayWIB();
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const wibYesterday = new Date(startOfYesterday.getTime() + WIB_OFFSET_MS);
  return {
    startISO: startOfYesterday.toISOString(),
    endISO: startOfToday.toISOString(),
    dateWIB: wibYesterday.toISOString().slice(0, 10),
  };
}

function isOverdue(metadata: unknown, cutoffISO: string): boolean {
  const followUp =
    typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).follow_up_terakhir
      : null;
  if (!followUp || typeof followUp !== "string") return true;
  const parsed = new Date(followUp).getTime();
  return Number.isNaN(parsed) || parsed < new Date(cutoffISO).getTime();
}

/**
 * Dipakai lewat createAdminClient() (service-role) -- baik untuk laporan
 * agregat (assignedTo kosong) maupun personal per user (assignedTo diisi),
 * karena keduanya butuh melewati RLS leads_owner_or_admin/
 * listings_owner_or_admin secara eksplisit dari kode, bukan otomatis dari
 * sesi login siapa pun.
 *
 * "Relevan" untuk sekarang: lead, listing, chat, AI Agent (token/biaya
 * estimasi dari ai.agent_runs, lihat getAiAgentUsage.ts) -- itu yang sudah
 * ada datanya. AI crawler, visitor listing/foto, download foto/video
 * SENGAJA belum masuk sini -- belum ada instrumentasi tracking-nya sama
 * sekali di codebase, beda kelas pekerjaan dari agregasi angka yang sudah
 * ada. Lihat docs/status.mdx Task 026/027 untuk rencana lanjutannya.
 */
export async function getDailyReport(
  supabase: SupabaseClient<Database>,
  options: GetDailyReportOptions = {}
): Promise<DailyReport> {
  const assignedTo = options.assignedTo ?? null;
  const { startISO: dayStart, endISO: dayEnd, dateWIB } = getReportDayWindow();
  const followUpCutoff = new Date(Date.now() - FOLLOW_UP_OVERDUE_HOURS * 60 * 60 * 1000).toISOString();
  const frozenCutoff = new Date(Date.now() - FROZEN_LEAD_OVERDUE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  function leadsQuery() {
    let q = supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (assignedTo) q = q.eq("assigned_to", assignedTo);
    return q;
  }

  function leadsWithMetadataQuery() {
    let q = supabase.schema("customer").from("leads").select("metadata").is("deleted_at", null);
    if (assignedTo) q = q.eq("assigned_to", assignedTo);
    return q;
  }

  let listingsQuery = supabase.schema("property").from("listings").select("id, metadata, created_at").is("deleted_at", null);
  if (assignedTo) listingsQuery = listingsQuery.eq("assigned_to", assignedTo);

  const [
    leadsTotal,
    leadsToday,
    leadsHot,
    leadsWarm,
    leadsCold,
    leadsClosing,
    leadsBatal,
    listingsAll,
    hotWarmLeads,
    coldLeads,
  ] = await Promise.all([
    leadsQuery(),
    leadsQuery().gte("created_at", dayStart).lt("created_at", dayEnd),
    leadsQuery().ilike("metadata->>status_funnel_awal", "hot"),
    leadsQuery().ilike("metadata->>status_funnel_awal", "warm"),
    leadsQuery().ilike("metadata->>status_funnel_awal", "cold"),
    leadsQuery().ilike("metadata->>status_funnel_awal", "closing"),
    leadsQuery().ilike("metadata->>status_funnel_awal", "batal"),
    listingsQuery,
    leadsWithMetadataQuery().or("metadata->>status_funnel_awal.ilike.hot,metadata->>status_funnel_awal.ilike.warm"),
    leadsWithMetadataQuery().ilike("metadata->>status_funnel_awal", "cold"),
  ]);

  const followUpBacklog = (hotWarmLeads.data ?? []).filter((l) => isOverdue(l.metadata, followUpCutoff)).length;
  const frozenLeads = (coldLeads.data ?? []).filter((l) => isOverdue(l.metadata, frozenCutoff)).length;

  const listingRows = listingsAll.data ?? [];
  const listingStats = { available: 0, booked: 0, sold: 0, hold: 0, hidden: 0, newToday: 0 };
  const listingIds: string[] = [];
  for (const row of listingRows) {
    listingIds.push(row.id);
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
    const createdAt = new Date(row.created_at).getTime();
    if (createdAt >= new Date(dayStart).getTime() && createdAt < new Date(dayEnd).getTime()) listingStats.newToday += 1;
  }

  // Chat tidak punya kolom assigned_to sendiri -- di-scope lewat lead_id
  // yang dimiliki user (customer.leads.assigned_to), bukan lewat kolom
  // langsung di chat.conversations/messages.
  let leadIdsForChatScope: string[] | null = null;
  if (assignedTo) {
    const { data } = await supabase.schema("customer").from("leads").select("id").eq("assigned_to", assignedTo).is("deleted_at", null);
    leadIdsForChatScope = (data ?? []).map((l) => l.id);
  }

  let conversationsQuery = supabase.schema("chat").from("conversations").select("id", { count: "exact", head: true });
  if (leadIdsForChatScope) {
    conversationsQuery =
      leadIdsForChatScope.length > 0 ? conversationsQuery.in("lead_id", leadIdsForChatScope) : conversationsQuery.eq("lead_id", "00000000-0000-0000-0000-000000000000");
  }

  const [conversationsTotal, conversationScopedMessages] = await Promise.all([
    conversationsQuery,
    assignedTo
      ? (async () => {
          if (!leadIdsForChatScope || leadIdsForChatScope.length === 0) return { data: [] as { sender_type: string; conversation_id: string }[] };
          const { data: scopedConversations } = await supabase
            .schema("chat")
            .from("conversations")
            .select("id")
            .in("lead_id", leadIdsForChatScope);
          const conversationIds = (scopedConversations ?? []).map((c) => c.id);
          if (conversationIds.length === 0) return { data: [] as { sender_type: string; conversation_id: string }[] };
          const { data } = await supabase
            .schema("chat")
            .from("messages")
            .select("sender_type, conversation_id")
            .in("conversation_id", conversationIds)
            .gte("created_at", dayStart)
            .lt("created_at", dayEnd)
            .is("deleted_at", null);
          return { data: data ?? [] };
        })()
      : supabase
          .schema("chat")
          .from("messages")
          .select("sender_type, conversation_id")
          .gte("created_at", dayStart)
          .lt("created_at", dayEnd)
          .is("deleted_at", null),
  ]);

  const messageRows = conversationScopedMessages.data ?? [];
  const activeConversationsToday = new Set(messageRows.map((m) => m.conversation_id)).size;
  const messagesInToday = messageRows.filter((m) => m.sender_type === "customer").length;
  const messagesOutToday = messageRows.length - messagesInToday;

  const aiAgent = await getAiAgentUsage(supabase, dayStart, dayEnd, assignedTo);

  return {
    generatedAt: new Date().toISOString(),
    reportDateWIB: dateWIB,
    isAggregate: !assignedTo,
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
      newToday: listingStats.newToday,
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
    aiAgent,
  };
}
