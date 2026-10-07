// src/lib/reports/getAiUsageSummary.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

/** Harga Sonnet 5.5 ($2/$10 per 1M token) -- estimasi, bukan invoice. Sama dengan getAiAgentUsage.ts. */
const INPUT_PER_TOKEN = 2 / 1_000_000;
const OUTPUT_PER_TOKEN = 10 / 1_000_000;
/** Prompt caching: baca cache 0,1x; tulis cache 5 menit 1,25x, 1 jam 2x dari harga input. */
const CACHE_READ_PER_TOKEN = INPUT_PER_TOKEN * 0.1;
const CACHE_WRITE_5M_PER_TOKEN = INPUT_PER_TOKEN * 1.25;
const CACHE_WRITE_1H_PER_TOKEN = INPUT_PER_TOKEN * 2;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE = 1000;

export interface AiUsagePeriod {
  label: string;
  messages: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  /** Panggilan Claude di luar chat (mis. Celah Pengetahuan), sudah termasuk di atas. */
  otherCalls: number;
  nurtureSent: number;
}

export interface AiUsageSummary {
  daily: AiUsagePeriod;
  weekly: AiUsagePeriod;
  monthly: AiUsagePeriod;
  /** Proyeksi sederhana: biaya bulan berjalan / hari berjalan x jumlah hari di bulan itu. */
  monthlyProjectionUsd: number;
  avgCostPerMessageUsd: number;
  topLeads: { leadId: string; name: string; messages: number; costUsd: number }[];
}

interface UsageRow {
  created_at: string;
  lead_id: string | null;
  status: string;
  usage: Json | null;
}

interface TokenUsage {
  /** Total token masukan (biasa + dibaca dari cache + ditulis ke cache). */
  input: number;
  output: number;
  costUsd: number;
}

const num = (v: unknown) => (typeof v === "number" ? v : 0);

function tokensOf(usage: Json | null): TokenUsage {
  if (!usage || typeof usage !== "object" || Array.isArray(usage)) return { input: 0, output: 0, costUsd: 0 };
  const u = usage as Record<string, unknown>;
  const plain = num(u.input_tokens);
  const read = num(u.cache_read_input_tokens);
  const creation = typeof u.cache_creation === "object" && u.cache_creation !== null ? (u.cache_creation as Record<string, unknown>) : {};
  const write5m = num(creation.ephemeral_5m_input_tokens);
  const write1h = num(creation.ephemeral_1h_input_tokens);
  // Total penulisan cache; kalau rincian TTL tidak ada, anggap 5 menit.
  const writeTotal = num(u.cache_creation_input_tokens);
  const write5mFinal = write5m + Math.max(0, writeTotal - write5m - write1h);
  const output = num(u.output_tokens);
  return {
    input: plain + read + write5mFinal + write1h,
    output,
    costUsd:
      plain * INPUT_PER_TOKEN +
      read * CACHE_READ_PER_TOKEN +
      write5mFinal * CACHE_WRITE_5M_PER_TOKEN +
      write1h * CACHE_WRITE_1H_PER_TOKEN +
      output * OUTPUT_PER_TOKEN,
  };
}

function cost(input: number, output: number): number {
  return input * INPUT_PER_TOKEN + output * OUTPUT_PER_TOKEN;
}

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await build(from, from + PAGE - 1);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

/**
 * Ringkasan pemakaian AI (harian = hari laporan, mingguan = 7 hari, bulanan =
 * bulan berjalan WIB sampai akhir hari laporan). Sumber: ai.agent_runs (chat,
 * usage dari respons asli Claude), ai.llm_usage (panggilan lain) dan
 * ai.nurture_sends (template WhatsApp berbayar). Estimasi, bukan invoice.
 */
export async function getAiUsageSummary(
  supabase: SupabaseClient<Database>,
  dayStartISO: string,
  dayEndISO: string
): Promise<AiUsageSummary> {
  const dayEnd = new Date(dayEndISO).getTime();
  const dayStart = new Date(dayStartISO).getTime();
  const wibReportDay = new Date(dayStart + WIB_OFFSET_MS);
  const monthStart =
    Date.UTC(wibReportDay.getUTCFullYear(), wibReportDay.getUTCMonth(), 1) - WIB_OFFSET_MS;
  const weekStart = dayEnd - 7 * DAY_MS;
  const earliest = Math.min(monthStart, weekStart);
  const earliestISO = new Date(earliest).toISOString();

  const [runs, others, nurture] = await Promise.all([
    fetchAll<UsageRow>((from, to) =>
      supabase
        .schema("ai")
        .from("agent_runs")
        .select("created_at, lead_id, status, usage:llm_raw_response->usage")
        .gte("created_at", earliestISO)
        .lt("created_at", dayEndISO)
        .order("created_at")
        .range(from, to) as unknown as PromiseLike<{ data: UsageRow[] | null }>
    ),
    fetchAll<{ created_at: string; input_tokens: number; output_tokens: number }>((from, to) =>
      supabase
        .schema("ai")
        .from("llm_usage")
        .select("created_at, input_tokens, output_tokens")
        .gte("created_at", earliestISO)
        .lt("created_at", dayEndISO)
        .order("created_at")
        .range(from, to)
    ),
    fetchAll<{ created_at: string }>((from, to) =>
      supabase
        .schema("ai")
        .from("nurture_sends")
        .select("created_at")
        .eq("status", "sent")
        .gte("created_at", earliestISO)
        .lt("created_at", dayEndISO)
        .order("created_at")
        .range(from, to)
    ),
  ]);

  const blank = (label: string): AiUsagePeriod => ({
    label,
    messages: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    otherCalls: 0,
    nurtureSent: 0,
  });
  const periods = [
    { p: blank("Kemarin"), from: dayStart },
    { p: blank("7 hari terakhir"), from: weekStart },
    { p: blank("Bulan ini"), from: monthStart },
  ];
  const inPeriod = (iso: string, from: number) => new Date(iso).getTime() >= from;

  const perLead = new Map<string, { messages: number; costUsd: number }>();
  let monthMessages = 0;
  let monthCost = 0;

  for (const run of runs) {
    const { input, output, costUsd: c } = tokensOf(run.usage);
    const isMessage = run.status === "success";
    for (const { p, from } of periods) {
      if (!inPeriod(run.created_at, from)) continue;
      if (isMessage) p.messages += 1;
      p.inputTokens += input;
      p.outputTokens += output;
      p.costUsd += c;
    }
    if (inPeriod(run.created_at, monthStart)) {
      if (isMessage) monthMessages += 1;
      monthCost += c;
      if (run.lead_id) {
        const cur = perLead.get(run.lead_id) ?? { messages: 0, costUsd: 0 };
        cur.messages += isMessage ? 1 : 0;
        cur.costUsd += c;
        perLead.set(run.lead_id, cur);
      }
    }
  }

  for (const row of others) {
    const c = cost(row.input_tokens, row.output_tokens);
    for (const { p, from } of periods) {
      if (!inPeriod(row.created_at, from)) continue;
      p.otherCalls += 1;
      p.inputTokens += row.input_tokens;
      p.outputTokens += row.output_tokens;
      p.costUsd += c;
    }
  }
  for (const row of nurture) {
    for (const { p, from } of periods) if (inPeriod(row.created_at, from)) p.nurtureSent += 1;
  }

  const topIds = [...perLead.entries()].sort((a, b) => b[1].costUsd - a[1].costUsd).slice(0, 5);
  const { data: leadRows } = topIds.length
    ? await supabase
        .schema("customer")
        .from("leads")
        .select("id, first_name, last_name")
        .in("id", topIds.map(([id]) => id))
    : { data: [] as { id: string; first_name: string; last_name: string | null }[] };
  const nameById = new Map(
    (leadRows ?? []).map((l) => [l.id, [l.first_name, l.last_name].filter(Boolean).join(" ").trim() || "(tanpa nama)"])
  );

  const daysElapsed = Math.max(1, Math.round((dayEnd - monthStart) / DAY_MS));
  const daysInMonth = new Date(Date.UTC(wibReportDay.getUTCFullYear(), wibReportDay.getUTCMonth() + 1, 0)).getUTCDate();

  return {
    daily: periods[0].p,
    weekly: periods[1].p,
    monthly: periods[2].p,
    monthlyProjectionUsd: (periods[2].p.costUsd / daysElapsed) * daysInMonth,
    avgCostPerMessageUsd: monthMessages > 0 ? monthCost / monthMessages : 0,
    topLeads: topIds.map(([id, v]) => ({
      leadId: id,
      name: nameById.get(id) ?? "(tanpa nama)",
      messages: v.messages,
      costUsd: v.costUsd,
    })),
  };
}
