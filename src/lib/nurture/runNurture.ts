// src/lib/nurture/runNurture.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/kapso";
import { getPhoneNumberIdForUser } from "@/lib/whatsapp/whatsappNumbers";
import { FOLLOW_UP_TEMPLATES } from "@/lib/whatsapp/followUpTemplates";
import { DEFAULT_NURTURE_SETTINGS, pickNurtureTemplate, settingsFromRow, type NurtureSettings } from "@/lib/nurture/settings";

/**
 * Nurturing otomatis -- aturan KONSERVATIF (dipilih Yohan 4 Okt 2026):
 * Angka di bawah adalah DEFAULT; tiap akun agen bisa mengubahnya di Settings (ai.nurture_settings,
 * lihat src/lib/nurture/settings.ts) -- jeda diam, jeda antar langkah, maks langkah, jam kirim,
 * Temperature yang di-nurture, template per kata kunci, dan saklar aktif per akun.
 * - Step 1: lead diam >= 48 jam (tanpa aktivitas pesan APA PUN, termasuk balasan AI/agen).
 * - Step 2: >= 5 hari setelah step 1, dan lead belum membalas sejak step 1. Maksimal 2 step.
 * - Hanya jam 08.00-19.59 WIB; maksimal MAX_SENDS_PER_RUN kirim per panggilan (dipanggil tiap jam).
 * - Hanya lead yang PERNAH chat ke nomor bisnis dan aktivitas terakhirnya dalam 14 hari
 *   (lead lama dari spreadsheet tanpa chat TIDAK pernah tersentuh).
 * - Temperature yang di-nurture: kosong/Cold/Warm. Hot (agen yang tangani), Closing, Batal TIDAK.
 * - Berhenti kalau lead membalas, atau pesan terakhirnya berisi penolakan ("belum saat ini", dst).
 * - DRY-RUN kecuali env NURTURE_ENABLED=true (jaring pengaman -- tidak ada pesan terkirim sebelum diaktifkan).
 */
/** Batas terlonggar yang mungkin diatur akun (settings.ts) -- dipakai untuk menyaring kandidat sebelum aturan akun masing-masing diperiksa. */
const MIN_SILENCE_HOURS = 24;
const EARLIEST_SEND_HOUR_WIB = 6;
const LATEST_SEND_HOUR_WIB = 22;
const LOOKBACK_DAYS = 14;
const MAX_SENDS_PER_RUN = 10;
const FAILED_RETRY_HOURS = 6;
const WIB_OFFSET_HOURS = 7;
const STOP_PATTERN =
  /belum saat ini|sudah dapat rumah|sudah dapet rumah|tidak jadi|gak jadi|ga jadi|batal|jangan (?:hubungi|chat|kirim)|stop/i;

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

export async function runNurture(supabase: SupabaseClient<Database>, now = new Date()): Promise<NurtureResult> {
  const enabled = process.env.NURTURE_ENABLED === "true";
  const wibHour = (now.getUTCHours() + WIB_OFFSET_HOURS) % 24;

  if (wibHour < EARLIEST_SEND_HOUR_WIB || wibHour >= LATEST_SEND_HOUR_WIB) {
    return { enabled, skippedReason: "di luar jam kirim (06.00-22.00 WIB)", candidates: 0, eligible: [], sent: 0, failed: 0 };
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

  const silentCutoff = now.getTime() - MIN_SILENCE_HOURS * HOUR_MS;
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

  // Aturan per akun agen pemilik lead; akun tanpa baris memakai default.
  const ownerIds = Array.from(new Set((leads ?? []).map((l) => l.assigned_to).filter((id): id is string => Boolean(id))));
  const { data: settingRows } = ownerIds.length
    ? await supabase.schema("ai").from("nurture_settings").select("*").in("user_id", ownerIds)
    : { data: [] };
  const settingsByUser = new Map<string, NurtureSettings>(
    (settingRows ?? []).map((row) => [row.user_id, settingsFromRow(row)])
  );
  const result: NurtureResult = { enabled, candidates: candidateConversationIds.length, eligible: [], sent: 0, failed: 0 };
  const handledLeads = new Set<string>();

  for (const conversation of conversations ?? []) {
    if (result.sent + result.failed >= MAX_SENDS_PER_RUN) break;

    const leadId = conversation.lead_id as string;
    if (handledLeads.has(leadId)) continue;
    const lead = leadById.get(leadId);
    if (!lead || !lead.phone || !lead.assigned_to) continue;

    const settings = settingsByUser.get(lead.assigned_to) ?? DEFAULT_NURTURE_SETTINGS;
    if (!settings.enabled) continue;
    if (wibHour < settings.sendHourStart || wibHour >= settings.sendHourEnd) continue;
    if ((lastAny.get(conversation.id) ?? Infinity) > now.getTime() - settings.silenceHours * HOUR_MS) continue;

    const metadata = (lead.metadata ?? {}) as Record<string, unknown>;
    const temperature = (metadata.status_funnel_awal as string | undefined) || "Belum ada";
    if (!settings.allowedTemperatures.includes(temperature)) continue;

    const inbound = lastInbound.get(conversation.id);
    if (!inbound || STOP_PATTERN.test(inbound.content)) continue;

    const leadSends = (sends ?? []).filter((s) => s.lead_id === leadId);
    const sentRows = leadSends.filter((s) => s.status === "sent");
    const lastFailed = leadSends.find((s) => s.status === "failed");
    if (lastFailed && now.getTime() - new Date(lastFailed.created_at).getTime() < FAILED_RETRY_HOURS * HOUR_MS) continue;

    const step = sentRows.length + 1;
    if (step > settings.maxSteps) continue;

    if (step >= 2) {
      const lastSentAt = new Date(sentRows[0].created_at).getTime();
      if (now.getTime() - lastSentAt < settings.stepGapDays * DAY_MS) continue;
      if (inbound.at > lastSentAt) continue; // lead sudah membalas sejak step sebelumnya -- percakapan hidup lagi
    }

    const templateName = pickNurtureTemplate(metadata, settings);
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
