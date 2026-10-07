// src/lib/reports/getAiAgentUsage.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface AiAgentUsage {
  runsToday: number;
  repliesSentToday: number;
  photosSentToday: number;
  needsFollowUpToday: number;
  inputTokensToday: number;
  outputTokensToday: number;
  estimatedCostUsd: number;
}

// Harga Sonnet 5.5 (model default ANTHROPIC_MODEL) -- $2/$10 per 1M token.
// Cuma buat ESTIMASI tampilan laporan (dari response.usage yang disimpan di
// ai.agent_runs.llm_raw_response), BUKAN sumber kebenaran biaya asli -- kalau
// model default berubah lewat env var, update angka ini manual juga.
const SONNET_55_INPUT_PER_TOKEN = 2 / 1_000_000;
const SONNET_55_OUTPUT_PER_TOKEN = 10 / 1_000_000;

interface AgentRunRow {
  lead_id: string | null;
  status: string;
  reply_sent: boolean;
  llm_raw_response: Json | null;
}

const num = (v: unknown) => (typeof v === "number" ? v : 0);

/** Token + biaya satu respons. input_tokens TIDAK mencakup bagian prompt caching, jadi cache dihitung terpisah (baca 0,1x; tulis 5 menit 1,25x; tulis 1 jam 2x). */
function extractUsage(raw: Json | null): { input: number; output: number; costUsd: number } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { input: 0, output: 0, costUsd: 0 };
  const usage = (raw as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") return { input: 0, output: 0, costUsd: 0 };
  const u = usage as Record<string, unknown>;
  const creation = typeof u.cache_creation === "object" && u.cache_creation !== null ? (u.cache_creation as Record<string, unknown>) : {};
  const plain = num(u.input_tokens);
  const read = num(u.cache_read_input_tokens);
  const write1h = num(creation.ephemeral_1h_input_tokens);
  const write5m = num(creation.ephemeral_5m_input_tokens) + Math.max(0, num(u.cache_creation_input_tokens) - num(creation.ephemeral_5m_input_tokens) - write1h);
  const output = num(u.output_tokens);
  return {
    input: plain + read + write5m + write1h,
    output,
    costUsd:
      plain * SONNET_55_INPUT_PER_TOKEN +
      read * SONNET_55_INPUT_PER_TOKEN * 0.1 +
      write5m * SONNET_55_INPUT_PER_TOKEN * 1.25 +
      write1h * SONNET_55_INPUT_PER_TOKEN * 2 +
      output * SONNET_55_OUTPUT_PER_TOKEN,
  };
}

/**
 * Pemakaian AI Agent untuk SATU HARI PENUH (WIB, batas [dayStartISO,
 * dayEndISO) -- lihat getReportDayWindow() di getDailyReport.ts, biasanya
 * "kemarin" relatif ke saat laporan dikirim) -- dipakai Daily Report
 * (personal, di-scope ke assignedTo) dan Platform Report (agregat,
 * assignedTo null). Sumber data nyata pertama (bukan roadmap/ilustratif
 * seperti aiAgentRoadmap.ts) sejak AI Agent live-tested 30 Sep 2026.
 *
 * Token/biaya dari ai.agent_runs.llm_raw_response.usage (respons asli Claude
 * API). Butuh follow-up dari core.notifications (sudah per-recipient, jadi
 * scoping "per user" otomatis ikut recipient_id). Foto terkirim dari
 * chat.messages (message_type "image" + ai_generated true, ditulis
 * applyAgentDecision() saat kirim foto listing lewat Kapso).
 */
export async function getAiAgentUsage(
  supabase: SupabaseClient<Database>,
  dayStartISO: string,
  dayEndISO: string,
  assignedTo: string | null
): Promise<AiAgentUsage> {
  const { data: runs } = await supabase
    .schema("ai")
    .from("agent_runs")
    .select("lead_id, status, reply_sent, llm_raw_response")
    .gte("created_at", dayStartISO)
    .lt("created_at", dayEndISO);

  let scopedRuns = (runs ?? []) as AgentRunRow[];

  if (assignedTo) {
    const leadIds = [...new Set(scopedRuns.map((r) => r.lead_id).filter((id): id is string => Boolean(id)))];
    if (leadIds.length === 0) {
      scopedRuns = [];
    } else {
      const { data: leads } = await supabase.schema("customer").from("leads").select("id, assigned_to").in("id", leadIds);
      const ownLeadIds = new Set((leads ?? []).filter((l) => l.assigned_to === assignedTo).map((l) => l.id));
      scopedRuns = scopedRuns.filter((r) => r.lead_id && ownLeadIds.has(r.lead_id));
    }
  }

  let inputTokensToday = 0;
  let outputTokensToday = 0;
  let costUsdToday = 0;
  let repliesSentToday = 0;
  const runsToday = scopedRuns.filter((r) => r.status === "success").length;

  for (const run of scopedRuns) {
    if (run.reply_sent) repliesSentToday += 1;
    const { input, output, costUsd } = extractUsage(run.llm_raw_response);
    inputTokensToday += input;
    outputTokensToday += output;
    costUsdToday += costUsd;
  }

  const { data: photoMessages } = await supabase
    .schema("chat")
    .from("messages")
    .select("id, conversation_id")
    .eq("sender_type", "agent")
    .eq("metadata->>message_type", "image")
    .eq("metadata->>ai_generated", "true")
    .gte("created_at", dayStartISO)
    .lt("created_at", dayEndISO);

  let photosSentToday = (photoMessages ?? []).length;

  if (assignedTo && photosSentToday > 0) {
    const conversationIds = [...new Set((photoMessages ?? []).map((m) => m.conversation_id))];
    const { data: conversations } = await supabase.schema("chat").from("conversations").select("id, lead_id").in("id", conversationIds);
    const leadIds = [...new Set((conversations ?? []).map((c) => c.lead_id).filter((id): id is string => Boolean(id)))];
    const { data: leads } = leadIds.length
      ? await supabase.schema("customer").from("leads").select("id, assigned_to").in("id", leadIds)
      : { data: [] as { id: string; assigned_to: string | null }[] };
    const ownLeadIds = new Set((leads ?? []).filter((l) => l.assigned_to === assignedTo).map((l) => l.id));
    const ownConversationIds = new Set((conversations ?? []).filter((c) => c.lead_id && ownLeadIds.has(c.lead_id)).map((c) => c.id));
    photosSentToday = (photoMessages ?? []).filter((m) => ownConversationIds.has(m.conversation_id)).length;
  }

  let followUpQuery = supabase
    .schema("core")
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("type", "ai_agent_needs_follow_up")
    .gte("created_at", dayStartISO)
    .lt("created_at", dayEndISO);
  if (assignedTo) followUpQuery = followUpQuery.eq("recipient_id", assignedTo);
  const { count: needsFollowUpToday } = await followUpQuery;

  return {
    runsToday,
    repliesSentToday,
    photosSentToday,
    needsFollowUpToday: needsFollowUpToday ?? 0,
    inputTokensToday,
    outputTokensToday,
    estimatedCostUsd: costUsdToday,
  };
}
