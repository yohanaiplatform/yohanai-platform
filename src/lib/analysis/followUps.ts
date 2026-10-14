// src/lib/analysis/followUps.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { firstObjectionLabel } from "@/lib/analysis/objections";
import {
  FOLLOW_UP_LIST_LIMIT,
  STALLED_DAYS,
  UNANSWERED_HOURS,
  type FollowUpLead,
  type FollowUpList,
} from "@/lib/analysis/types";

const DAY_MS = 24 * 3600 * 1000;
const PAGE = 1000;
/** Jendela pesan yang dibaca untuk mengetahui pesan terakhir (hari). */
const MESSAGE_WINDOW_DAYS = 30;

export interface FollowUpLeadInfo {
  name: string;
  slug: string | null;
  temperature: string;
}

export interface BuildFollowUpsInput {
  leads: Map<string, FollowUpLeadInfo>;
  /** Pesan terakhir per lead (siapa pengirimnya, kapan). */
  lastByLead: Map<string, { senderType: string; at: string }>;
  /** Keberatan pada pesan TERAKHIR calon pembeli per lead. */
  lastObjectionByLead: Map<string, { label: string; at: string }>;
  now: Date;
}

/**
 * Tiga daftar lead yang layak ditindaklanjuti, dipakai analisis berkala (semua agen) dan tampilan per agen (hanya lead
 * miliknya): menunggu balasan (pesan terakhir dari calon pembeli > 2 jam; paling mendesak), sepi > 5 hari (Hot/Warm tanpa
 * pesan sama sekali), dan berhenti setelah keberatan (Warm/Cold; peluang reaktivasi). Satu lead hanya di satu daftar.
 * Hot didahulukan, lalu yang paling lama menunggu. Memuat NAMA lead: jangan dikirim ke LLM.
 */
export function buildFollowUps(input: BuildFollowUpsInput): FollowUpList {
  const stalledBefore = input.now.getTime() - STALLED_DAYS * DAY_MS;
  const unansweredBefore = input.now.getTime() - UNANSWERED_HOURS * 3600000;

  const toLead = (kind: FollowUpLead["kind"], leadId: string, at: string): FollowUpLead => {
    const lead = input.leads.get(leadId);
    return {
      leadId,
      slug: lead?.slug ?? null,
      name: lead?.name ?? "(tanpa nama)",
      temperature: lead?.temperature ?? "-",
      kind,
      lastAt: at,
      objection: input.lastObjectionByLead.get(leadId)?.label ?? null,
    };
  };
  const byUrgency = (a: FollowUpLead, b: FollowUpLead) =>
    (a.temperature === "Hot" ? 0 : 1) - (b.temperature === "Hot" ? 0 : 1) || a.lastAt.localeCompare(b.lastAt);

  const waiting: FollowUpLead[] = [];
  const stalled: FollowUpLead[] = [];
  for (const [leadId, last] of input.lastByLead) {
    const temp = input.leads.get(leadId)?.temperature;
    if (temp !== "Hot" && temp !== "Warm") continue;
    const at = new Date(last.at).getTime();
    if (last.senderType === "customer" && at < unansweredBefore) waiting.push(toLead("waiting", leadId, last.at));
    else if (at < stalledBefore) stalled.push(toLead("stalled", leadId, last.at));
  }
  waiting.sort(byUrgency);
  stalled.sort(byUrgency);

  const inHotWarmLists = new Set([...waiting, ...stalled].map((l) => l.leadId));
  const objection: FollowUpLead[] = [];
  for (const [leadId, last] of input.lastObjectionByLead) {
    const temp = input.leads.get(leadId)?.temperature;
    if (!temp || inHotWarmLists.has(leadId) || temp === "Hot" || temp.startsWith("Closing") || temp === "Booking" || temp === "Batal") continue;
    if (new Date(last.at).getTime() >= stalledBefore) continue;
    objection.push(toLead("objection", leadId, last.at));
  }
  objection.sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return {
    waiting: waiting.slice(0, FOLLOW_UP_LIST_LIMIT),
    stalled: stalled.slice(0, FOLLOW_UP_LIST_LIMIT),
    objection: objection.slice(0, FOLLOW_UP_LIST_LIMIT),
    totals: { waiting: waiting.length, stalled: stalled.length, objection: objection.length },
  };
}

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

const EMPTY: FollowUpList = { waiting: [], stalled: [], objection: [], totals: { waiting: 0, stalled: 0, objection: 0 } };

/**
 * Daftar tindak lanjut untuk satu agen (`assignedTo` = id user) atau semua lead (`assignedTo` null, khusus admin).
 * Memakai klien service-role dengan scope MANUAL (pola yang sama seperti laporan harian): pemanggil wajib mengisi
 * assignedTo dari sesi login, jangan dari input pengguna. Hanya membaca pesan 30 hari terakhir.
 */
export async function getFollowUps(
  admin: SupabaseClient<Database>,
  options: { assignedTo?: string | null } = {},
  now = new Date()
): Promise<FollowUpList> {
  const assignedTo = options.assignedTo ?? null;
  const since = new Date(now.getTime() - MESSAGE_WINDOW_DAYS * DAY_MS).toISOString();

  const leadRows = await fetchAll((from, to) => {
    let q = admin
      .schema("customer")
      .from("leads")
      .select("id, first_name, last_name, slug, metadata")
      .is("deleted_at", null)
      .order("created_at")
      .range(from, to);
    if (assignedTo) q = q.eq("assigned_to", assignedTo);
    return q;
  });

  const leads = new Map<string, FollowUpLeadInfo>();
  for (const lead of leadRows) {
    const raw = asRecord(lead.metadata).status_funnel_awal;
    const temperature = typeof raw === "string" && raw.trim() ? raw.trim() : "Belum dinilai";
    // Hanya tahap yang bisa ditindaklanjuti.
    if (temperature !== "Hot" && temperature !== "Warm" && temperature !== "Cold") continue;
    leads.set(lead.id, {
      name: [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "(tanpa nama)",
      slug: lead.slug ?? null,
      temperature,
    });
  }
  if (leads.size === 0) return EMPTY;

  const [conversations, messages] = await Promise.all([
    fetchAll((from, to) => admin.schema("chat").from("conversations").select("id, lead_id").is("deleted_at", null).order("created_at").range(from, to)),
    fetchAll((from, to) =>
      admin
        .schema("chat")
        .from("messages")
        .select("conversation_id, sender_type, content, created_at")
        .is("deleted_at", null)
        .gte("created_at", since)
        .order("created_at")
        .range(from, to)
    ),
  ]);

  const leadOfConversation = new Map<string, string>();
  for (const c of conversations) if (c.lead_id && leads.has(c.lead_id)) leadOfConversation.set(c.id, c.lead_id);

  const lastByLead = new Map<string, { senderType: string; at: string }>();
  const lastCustomer = new Map<string, { at: string; content: string }>();
  for (const m of messages) {
    const leadId = leadOfConversation.get(m.conversation_id);
    if (!leadId) continue;
    const prev = lastByLead.get(leadId);
    if (!prev || m.created_at >= prev.at) lastByLead.set(leadId, { senderType: m.sender_type, at: m.created_at });
    if (m.sender_type === "customer" && m.content) {
      const prevC = lastCustomer.get(leadId);
      if (!prevC || m.created_at >= prevC.at) lastCustomer.set(leadId, { at: m.created_at, content: m.content });
    }
  }

  const lastObjectionByLead = new Map<string, { label: string; at: string }>();
  for (const [leadId, last] of lastCustomer) {
    const label = firstObjectionLabel(last.content);
    if (label) lastObjectionByLead.set(leadId, { label, at: last.at });
  }

  return buildFollowUps({ leads, lastByLead, lastObjectionByLead, now });
}
