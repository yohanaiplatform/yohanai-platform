// src/lib/analysis/computeMetrics.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  MIN_SOURCE_SAMPLE,
  STALLED_DAYS,
  UNANSWERED_HOURS,
  type AnalysisMetrics,
  type CountItem,
  type SourceRow,
} from "@/lib/analysis/types";
import { computeTopicMetrics } from "@/lib/analysis/topics";
import { computeObjectionMetrics } from "@/lib/analysis/objections";
import { computeDemandMetrics } from "@/lib/analysis/demand";
import { computeReasonMetrics } from "@/lib/analysis/reasons";
import type { FollowUpList } from "@/lib/analysis/types";
import { buildFollowUps } from "@/lib/analysis/followUps";

const PAGE = 1000;
const SOURCE_COHORT_DAYS = 30;
const MAX_SOURCE_ROWS = 8;
const DAY_MS = 24 * 3600 * 1000;

type Admin = SupabaseClient<Database>;

/** PostgREST membatasi 1000 baris per request -- ambil bertahap sampai habis. */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await build(from, from + PAGE - 1);
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < PAGE) break;
  }
  return rows;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Nama sumber lead: postingan/iklan (platform + judul) bila ada, jika tidak "sumber informasi", jika tidak "Tidak diketahui". */
export function sourceLabel(metadata: Record<string, unknown>): string {
  const dd = metadata.datang_dari;
  if (dd && typeof dd === "object" && !Array.isArray(dd)) {
    const r = dd as Record<string, unknown>;
    const parts = [str(r.platform), str(r.judul)].filter(Boolean);
    const isi = str(r.isi);
    const base = parts.join(" - ") || "Postingan/iklan";
    return isi ? `${base} (${isi.slice(0, 40)})` : base;
  }
  const plain = str(dd);
  if (plain) return plain.slice(0, 80);
  return str(metadata.sumber_informasi) ?? "Tidak diketahui";
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function toCountItems(map: Map<string, number>, limit?: number): CountItem[] {
  const items = Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  return limit ? items.slice(0, limit) : items;
}

/**
 * Angka untuk analisis mingguan -- SEMUA dihitung di sini (kode), AI hanya merangkum hasilnya. Hanya agregat: tidak ada nomor
 * HP, nama, atau isi pesan yang keluar dari fungsi ini. Memakai klien service-role (semua agen); pemanggil wajib sudah
 * memeriksa hak akses.
 */
export async function computeAnalysisMetrics(admin: Admin, days = 7, now = new Date()): Promise<AnalysisMetrics> {
  return (await computeAnalysisData(admin, days, now)).metrics;
}

/**
 * Metrik agregat (aman untuk LLM) + daftar lead tindak lanjut (memuat nama lead: JANGAN dikirim ke LLM, hanya untuk
 * ditampilkan ke pemilik). Satu kali ambil data untuk keduanya.
 */
export async function computeAnalysisData(
  admin: Admin,
  days = 7,
  now = new Date()
): Promise<{ metrics: AnalysisMetrics; followUps: FollowUpList }> {
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - days * DAY_MS);
  const periodStartISO = periodStart.toISOString();
  const cohortSince = new Date(now.getTime() - SOURCE_COHORT_DAYS * DAY_MS).toISOString();

  const [leads, history, runs, queueRes, messages, conversations, customerMessages, listings] = await Promise.all([
    fetchAll((from, to) =>
      admin
        .schema("customer")
        .from("leads")
        .select("id, created_at, metadata, first_name, last_name, slug")
        .is("deleted_at", null)
        .order("created_at")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      admin
        .schema("customer")
        .from("lead_temperature_history")
        .select("lead_id, from_temperature, to_temperature, source, created_at")
        .order("created_at")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      admin
        .schema("ai")
        .from("agent_runs")
        .select("lead_id, status, confidence, reply_sent, created_at")
        .gte("created_at", periodStartISO)
        .order("created_at")
        .range(from, to)
    ),
    admin.schema("ai").from("follow_up_queue").select("id", { count: "exact", head: true }).gte("created_at", periodStartISO),
    fetchAll((from, to) =>
      admin
        .schema("chat")
        .from("messages")
        .select("conversation_id, sender_type, created_at")
        .is("deleted_at", null)
        .gte("created_at", new Date(now.getTime() - 30 * DAY_MS).toISOString())
        .order("created_at")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      admin.schema("chat").from("conversations").select("id, lead_id").is("deleted_at", null).order("created_at").range(from, to)
    ),
    // Seluruh pesan calon pembeli (isi hanya dicocokkan kata kunci di kode; tidak dikirim ke LLM).
    fetchAll((from, to) =>
      admin
        .schema("chat")
        .from("messages")
        .select("conversation_id, content, created_at")
        .eq("sender_type", "customer")
        .is("deleted_at", null)
        .order("created_at")
        .range(from, to)
    ),
    fetchAll((from, to) =>
      admin.schema("property").from("listings").select("id, title, address, metadata").is("deleted_at", null).order("created_at").range(from, to)
    ),
  ]);

  const leadById = new Map<
    string,
    { createdAt: string; temperature: string; metadata: Record<string, unknown>; name: string; slug: string | null }
  >();
  const currentCounts = new Map<string, number>();
  for (const lead of leads) {
    const metadata = asRecord(lead.metadata);
    const temperature = str(metadata.status_funnel_awal) ?? "Belum dinilai";
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "(tanpa nama)";
    leadById.set(lead.id, { createdAt: lead.created_at, temperature, metadata, name, slug: lead.slug ?? null });
    currentCounts.set(temperature, (currentCounts.get(temperature) ?? 0) + 1);
  }

  // Funnel: transisi dalam periode + median waktu sampai Hot (seluruh riwayat, pertama kali per lead).
  const transitionCounts = new Map<string, number>();
  let auto = 0;
  let manual = 0;
  const firstHot = new Map<string, string>();
  for (const row of history) {
    // Hanya perpindahan nyata ke Hot (from tidak null); lead yang langsung dinilai Hot saat dibuat bukan "naik ke Hot".
    if (row.to_temperature === "Hot" && row.from_temperature && !firstHot.has(row.lead_id)) firstHot.set(row.lead_id, row.created_at);
    if (row.created_at < periodStartISO) continue;
    // Baris awal (dari null) = penilaian pertama lead baru, bukan perpindahan tahap.
    if (row.from_temperature) {
      const key = `${row.from_temperature} > ${row.to_temperature}`;
      transitionCounts.set(key, (transitionCounts.get(key) ?? 0) + 1);
    }
    if (row.source === "manual") manual += 1;
    else auto += 1;
  }
  const hoursToHot: number[] = [];
  for (const [leadId, hotAt] of firstHot) {
    const lead = leadById.get(leadId);
    if (!lead) continue;
    const hours = (new Date(hotAt).getTime() - new Date(lead.createdAt).getTime()) / 3600000;
    if (hours >= 0) hoursToHot.push(hours);
  }

  // Percakapan: pesan terakhir per percakapan -> lead mandek / belum dibalas.
  const lastMessage = new Map<string, { senderType: string; at: string }>();
  for (const m of messages) lastMessage.set(m.conversation_id, { senderType: m.sender_type, at: m.created_at });
  const lastByLead = new Map<string, { senderType: string; at: string }>();
  for (const c of conversations) {
    const last = lastMessage.get(c.id);
    if (!last || !c.lead_id) continue;
    const existing = lastByLead.get(c.lead_id);
    if (!existing || last.at > existing.at) lastByLead.set(c.lead_id, last);
  }
  let hotWarmWithChat = 0;
  let stalled = 0;
  let unanswered = 0;
  const stalledBefore = now.getTime() - STALLED_DAYS * DAY_MS;
  const unansweredBefore = now.getTime() - UNANSWERED_HOURS * 3600000;
  for (const [leadId, last] of lastByLead) {
    const temp = leadById.get(leadId)?.temperature;
    if (temp !== "Hot" && temp !== "Warm") continue;
    hotWarmWithChat += 1;
    const at = new Date(last.at).getTime();
    const isWaiting = last.senderType === "customer" && at < unansweredBefore;
    if (at < stalledBefore) stalled += 1;
    if (isWaiting) unanswered += 1;
  }

  // Kualitas per sumber: lead yang dibuat 30 hari terakhir, Temperature saat ini.
  const sourceMap = new Map<string, SourceRow>();
  let cohortLeads = 0;
  for (const lead of leadById.values()) {
    if (lead.createdAt < cohortSince) continue;
    cohortLeads += 1;
    const label = sourceLabel(lead.metadata);
    const row = sourceMap.get(label) ?? { label, leads: 0, hotWarm: 0, hot: 0, closing: 0, enough: false };
    row.leads += 1;
    if (lead.temperature === "Hot") {
      row.hot += 1;
      row.hotWarm += 1;
    } else if (lead.temperature === "Warm") row.hotWarm += 1;
    else if (lead.temperature.startsWith("Closing") || lead.temperature === "Booking") row.closing += 1;
    sourceMap.set(label, row);
  }
  const sourceRows = Array.from(sourceMap.values())
    .map((r) => ({ ...r, enough: r.leads >= MIN_SOURCE_SAMPLE }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, MAX_SOURCE_ROWS);

  // Kinerja AI dalam periode.
  const confidence = { high: 0, medium: 0, low: 0 };
  let success = 0;
  let errors = 0;
  let replySent = 0;
  const handled = new Set<string>();
  for (const run of runs) {
    if (run.status === "success") success += 1;
    else errors += 1;
    if (run.reply_sent) replySent += 1;
    if (run.lead_id) handled.add(run.lead_id);
    if (run.confidence === "high" || run.confidence === "medium" || run.confidence === "low") confidence[run.confidence] += 1;
  }
  let fromCustomer = 0;
  let fromAgent = 0;
  for (const m of messages) {
    if (m.created_at < periodStartISO) continue;
    if (m.sender_type === "customer") fromCustomer += 1;
    else if (m.sender_type === "agent") fromAgent += 1;
  }

  const leadOfConversation = new Map<string, string>();
  for (const cv of conversations) if (cv.lead_id) leadOfConversation.set(cv.id, cv.lead_id);
  const customerText = customerMessages.flatMap((m) => {
    const leadId = leadOfConversation.get(m.conversation_id);
    return leadId && m.content ? [{ leadId, at: m.created_at, content: m.content }] : [];
  });
  const temperatureByLead = new Map(Array.from(leadById.entries()).map(([id, l]) => [id, l.temperature]));
  const topics = computeTopicMetrics({
    messages: customerText,
    temperatureByLead,
    hotTransitions: history.filter((h) => h.to_temperature === "Hot" && h.from_temperature).map((h) => ({ leadId: h.lead_id, at: h.created_at })),
  });
  const objectionResult = computeObjectionMetrics({
    messages: customerText,
    temperatureByLead,
    recentSince: periodStartISO,
    silentBefore: new Date(stalledBefore).toISOString(),
  });

  // Permintaan lokasi vs stok listing tersedia (tidak disembunyikan).
  const demand = computeDemandMetrics({
    leads: Array.from(leadById.values()).flatMap((l) => {
      const interest = str(l.metadata.minat_unit_lokasi);
      return interest ? [{ createdAt: l.createdAt, temperature: l.temperature, interest }] : [];
    }),
    listings: listings.flatMap((li) => {
      const meta = asRecord(li.metadata);
      if (meta.status !== "available" || meta.hidden === true) return [];
      const tags = Array.isArray(meta.ai_tags) ? meta.ai_tags.filter((t): t is string => typeof t === "string") : [];
      return [{ text: [li.title, li.address, ...tags].filter(Boolean).join(" ") }];
    }),
    recentSince: cohortSince,
  });

  // Alasan Batal/Closing yang dicatat agen.
  const reasons = computeReasonMetrics({
    leads: Array.from(leadById.values()).map((l) => {
      const raw = asRecord(l.metadata.alasan_status);
      return { temperature: l.temperature, alasan: str(raw.alasan) };
    }),
  });

  // Daftar tindak lanjut (memuat nama lead -- tidak ikut ke LLM); logika bersama dengan tampilan per agen.
  const followUps = buildFollowUps({
    leads: new Map(Array.from(leadById.entries()).map(([id, l]) => [id, { name: l.name, slug: l.slug, temperature: l.temperature }])),
    lastByLead,
    lastObjectionByLead: objectionResult.lastObjectionByLead,
    now,
  });

  const metrics: AnalysisMetrics = {
    periodStart: periodStartISO,
    periodEnd: periodEnd.toISOString(),
    days,
    funnel: {
      total: leadById.size,
      current: toCountItems(currentCounts),
      transitions: toCountItems(transitionCounts, 8),
      transitionsAuto: auto,
      transitionsManual: manual,
      medianHoursToHot: median(hoursToHot),
      hotSample: hoursToHot.length,
      stalledHotWarm: stalled,
      hotWarmWithChat,
    },
    topics,
    objections: objectionResult.metrics,
    demand,
    reasons,
    sources: { cohortDays: SOURCE_COHORT_DAYS, cohortLeads, minSample: MIN_SOURCE_SAMPLE, rows: sourceRows },
    ai: {
      runs: runs.length,
      success,
      errors,
      leadsHandled: handled.size,
      confidence,
      replySent,
      followUpNotes: queueRes.count ?? 0,
      messagesFromCustomer: fromCustomer,
      messagesFromAgent: fromAgent,
      unansweredHotWarm: unanswered,
    },
  };
  return { metrics, followUps };
}
