// src/lib/nurture/runNurture.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/kapso";
import { getPhoneNumberIdForUser } from "@/lib/whatsapp/whatsappNumbers";
import { FOLLOW_UP_TEMPLATES } from "@/lib/whatsapp/followUpTemplates";

/**
 * Nurturing otomatis -- aturan KONSERVATIF (dipilih Yohan 4 Okt 2026):
 * - Step 1: lead diam >= 48 jam (tanpa aktivitas pesan APA PUN, termasuk balasan AI/agen).
 * - Step 2: >= 5 hari setelah step 1, dan lead belum membalas sejak step 1. Maksimal 2 step.
 * - Hanya jam 08.00-19.59 WIB; maksimal MAX_SENDS_PER_RUN kirim per panggilan (dipanggil tiap jam).
 * - Hanya lead yang PERNAH chat ke nomor bisnis dan aktivitas terakhirnya dalam 14 hari
 *   (lead lama dari spreadsheet tanpa chat TIDAK pernah tersentuh).
 * - Temperature yang di-nurture: kosong/Cold/Warm. Hot (agen yang tangani), Closing, Batal TIDAK.
 * - Berhenti kalau lead membalas, atau pesan terakhirnya berisi penolakan ("belum saat ini", dst).
 * - DRY-RUN kecuali env NURTURE_ENABLED=true (jaring pengaman -- tidak ada pesan terkirim sebelum diaktifkan).
 */
const STEP1_SILENCE_HOURS = 48;
const STEP2_GAP_DAYS = 5;
const MAX_STEPS = 2;
const LOOKBACK_DAYS = 14;
const MAX_SENDS_PER_RUN = 10;
const FAILED_RETRY_HOURS = 6;
const SEND_HOUR_START_WIB = 8;
const SEND_HOUR_END_WIB = 20;
const WIB_OFFSET_HOURS = 7;
const ALLOWED_TEMPERATURES: (string | null)[] = [null, "Cold", "Warm"];
const STOP_PATTERN =
  /belum saat ini|sudah dapat rumah|sudah dapet rumah|tidak jadi|gak jadi|ga jadi|batal|jangan (?:hubungi|chat|kirim)|stop/i;
const DEFAULT_TEMPLATE = "yohan_griya";
const KAPUR_MAS_TEMPLATE = "follow_up_kapur_mas_t2";

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface NurtureResult {
  enabled: boolean;
  skippedReason?: string;
  candidates: number;
  eligible: { lead: string; step: number; template: string }[];
  sent: number;
  failed: number;
}

function pickTemplate(metadata: Record<string, unknown>): string {
  const text = `${metadata.kategori ?? ""} ${metadata.minat_unit_lokasi ?? ""}`.toLowerCase();
  return text.includes("kapur mas") ? KAPUR_MAS_TEMPLATE : DEFAULT_TEMPLATE;
}

export async function runNurture(supabase: SupabaseClient<Database>, now = new Date()): Promise<NurtureResult> {
  const enabled = process.env.NURTURE_ENABLED === "true";
  const wibHour = (now.getUTCHours() + WIB_OFFSET_HOURS) % 24;

  if (wibHour < SEND_HOUR_START_WIB || wibHour >= SEND_HOUR_END_WIB) {
    return { enabled, skippedReason: "di luar jam kirim (08.00-20.00 WIB)", candidates: 0, eligible: [], sent: 0, failed: 0 };
  }

  const since = new Date(now.getTime() - LOOKBACK_DAYS * DAY_MS).toISOString();

  const { data: recent } = await supabase
    .schema("chat")
    .from("messages")
    .select("conversation_id, sender_type, content, created_at")
    .is("deleted_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  // Per percakapan: aktivitas terakhir (siapa pun), pesan lead terakhir + isinya.
  const lastAny = new Map<string, number>();
  const lastInbound = new Map<string, { at: number; content: string }>();
  for (const m of recent ?? []) {
    const at = new Date(m.created_at).getTime();
    if (!lastAny.has(m.conversation_id)) lastAny.set(m.conversation_id, at);
    if (m.sender_type === "customer" && !lastInbound.has(m.conversation_id)) {
      lastInbound.set(m.conversation_id, { at, content: m.content });
    }
  }

  const silentCutoff = now.getTime() - STEP1_SILENCE_HOURS * HOUR_MS;
  const candidateConversationIds = Array.from(lastInbound.keys()).filter(
    (id) => (lastAny.get(id) ?? Infinity) <= silentCutoff
  );
  if (candidateConversationIds.length === 0) {
    return { enabled, candidates: 0, eligible: [], sent: 0, failed: 0 };
  }

  const { data: conversations } = await supabase
    .schema("chat")
    .from("conversations")
    .select("id, lead_id, metadata")
    .in("id", candidateConversationIds)
    .not("lead_id", "is", null)
    .is("deleted_at", null);

  const leadIds = Array.from(new Set((conversations ?? []).map((c) => c.lead_id as string)));
  if (leadIds.length === 0) return { enabled, candidates: 0, eligible: [], sent: 0, failed: 0 };

  const [{ data: leads }, { data: sends }] = await Promise.all([
    supabase
      .schema("customer")
      .from("leads")
      .select("id, first_name, last_name, phone, metadata, assigned_to")
      .in("id", leadIds)
      .is("deleted_at", null),
    supabase
      .schema("ai")
      .from("nurture_sends")
      .select("lead_id, step, status, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false }),
  ]);

  const leadById = new Map((leads ?? []).map((l) => [l.id, l]));
  const result: NurtureResult = { enabled, candidates: candidateConversationIds.length, eligible: [], sent: 0, failed: 0 };
  const handledLeads = new Set<string>();

  for (const conversation of conversations ?? []) {
    if (result.sent + result.failed >= MAX_SENDS_PER_RUN) break;

    const leadId = conversation.lead_id as string;
    if (handledLeads.has(leadId)) continue;
    const lead = leadById.get(leadId);
    if (!lead || !lead.phone || !lead.assigned_to) continue;

    const metadata = (lead.metadata ?? {}) as Record<string, unknown>;
    const temperature = (metadata.status_funnel_awal as string | undefined) ?? null;
    if (!ALLOWED_TEMPERATURES.includes(temperature)) continue;

    const inbound = lastInbound.get(conversation.id);
    if (!inbound || STOP_PATTERN.test(inbound.content)) continue;

    const leadSends = (sends ?? []).filter((s) => s.lead_id === leadId);
    const sentRows = leadSends.filter((s) => s.status === "sent");
    const lastFailed = leadSends.find((s) => s.status === "failed");
    if (lastFailed && now.getTime() - new Date(lastFailed.created_at).getTime() < FAILED_RETRY_HOURS * HOUR_MS) continue;

    const step = sentRows.length + 1;
    if (step > MAX_STEPS) continue;

    if (step === 2) {
      const lastSentAt = new Date(sentRows[0].created_at).getTime();
      if (now.getTime() - lastSentAt < STEP2_GAP_DAYS * DAY_MS) continue;
      if (inbound.at > lastSentAt) continue; // lead sudah membalas sejak step 1 -- percakapan hidup lagi
    }

    const templateName = pickTemplate(metadata);
    const template = FOLLOW_UP_TEMPLATES.find((t) => t.name === templateName);
    if (!template) continue;

    const leadName = `${lead.first_name} ${lead.last_name}`.trim() || lead.phone;
    handledLeads.add(leadId);
    result.eligible.push({ lead: leadName, step, template: template.name });

    if (!enabled) continue;

    const conversationMetadata = (conversation.metadata ?? {}) as Record<string, unknown>;
    const phoneNumberId =
      (typeof conversationMetadata.phone_number_id === "string" ? conversationMetadata.phone_number_id : null) ??
      (await getPhoneNumberIdForUser(supabase, lead.assigned_to));

    const send = await sendWhatsAppTemplate(lead.phone, template.name, template.language, phoneNumberId);

    await supabase
      .schema("ai")
      .from("nurture_sends")
      .insert({
        lead_id: leadId,
        conversation_id: conversation.id,
        step,
        template_name: template.name,
        status: send.success ? "sent" : "failed",
        wa_message_id: send.messageId ?? null,
        error: send.success ? null : (send.error ?? "gagal").slice(0, 500),
      });

    if (!send.success) {
      result.failed += 1;
      continue;
    }

    result.sent += 1;
    await supabase
      .schema("chat")
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_type: "agent",
        content: `[Template follow-up otomatis (langkah ${step}) terkirim: ${template.name}]`,
        metadata: { wa_message_id: send.messageId ?? null, message_type: "template", nurture: true, step },
      });
  }

  return result;
}
