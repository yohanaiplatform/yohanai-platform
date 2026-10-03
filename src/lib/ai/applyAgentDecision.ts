// src/lib/ai/applyAgentDecision.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { sendWhatsAppText, sendWhatsAppImage } from "@/lib/whatsapp/kapso";
import type { AgentDecision } from "@/lib/ai/interpretLeadReply";

export interface ApplyAgentDecisionInput {
  leadId: string;
  leadName: string;
  currentFirstName: string;
  leadPhone: string;
  assignedTo: string | null;
  conversationId: string;
  triggerMessageId: string | null;
  currentMetadata: Json;
  currentTemperature: string | null;
  decision: AgentDecision;
  inputSnapshot: Json;
  rawResponse: Json | null;
  /** Nomor WA KITA yang dipakai lead ini chat -- dipakai supaya balasan terkirim dari nomor yang sama (migration 056, src/lib/whatsapp/whatsappNumbers.ts). */
  phoneNumberId: string | null;
}

/**
 * Marker author_label untuk note ringkasan percakapan otomatis AI Agent --
 * dipakai applyAgentDecision() (tulis/refresh) DAN webhook/route.ts (baca
 * sebagai previousSummary). Cuma SATU note dengan label ini yang aktif
 * (deleted_at null) per lead di satu waktu -- soft-delete yang lama dulu
 * sebelum insert yang baru, bukan UPDATE isi note (customer.notes sengaja
 * append-only, lihat migration 038), supaya Timeline manual tidak
 * berantakan tapi riwayat lama tetap ada di database kalau perlu ditelusuri.
 */
export const AI_SUMMARY_NOTE_AUTHOR_LABEL = "AI Agent (ringkasan otomatis)";

/** Nama dianggap placeholder (bukan nama asli) -- sama seperti kriteria di system prompt interpretLeadReply.ts, harus tetap sinkron. */
function isPlaceholderName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (/\(NN\)/i.test(trimmed)) return true;
  if (/^test lead$/i.test(trimmed)) return true;
  if (/^[0-9+\s-]+$/.test(trimmed)) return true;
  return false;
}

/**
 * Terapkan keputusan AI Agent (dari interpretLeadReply()): ubah Temperature
 * lead kalau ada perubahan, kirim balasan WA otomatis kalau ada & bukan
 * confidence rendah, lalu catat semuanya ke ai.agent_runs (audit trail --
 * Business Rule di docs/modules/ai.mdx: "Setiap hasil AI harus dapat
 * ditelusuri kembali ke sumber datanya").
 */
export async function applyAgentDecision(
  supabaseAdmin: SupabaseClient<Database>,
  input: ApplyAgentDecisionInput
): Promise<void> {
  const { decision } = input;

  // Update metadata lead sekali jalan: Temperature (status_funnel_awal) dan/atau
  // Minat Unit/Lokasi (minat_unit_lokasi) dari percakapan.
  const metadataUpdates: Record<string, Json> = {};
  if (decision.newTemperature && decision.newTemperature !== input.currentTemperature) {
    metadataUpdates.status_funnel_awal = decision.newTemperature;
  }
  const newMinatLokasi = decision.minatLokasi?.trim();
  if (newMinatLokasi) {
    metadataUpdates.minat_unit_lokasi = newMinatLokasi.slice(0, 80);
  }

  if (Object.keys(metadataUpdates).length > 0) {
    const baseMetadata =
      typeof input.currentMetadata === "object" && input.currentMetadata !== null && !Array.isArray(input.currentMetadata)
        ? (input.currentMetadata as Record<string, Json>)
        : {};

    await supabaseAdmin
      .schema("customer")
      .from("leads")
      .update({ metadata: { ...baseMetadata, ...metadataUpdates } })
      .eq("id", input.leadId);
  }

  // Simpan nama yang baru dikonfirmasi lead -- CUMA kalau nama saat ini
  // masih placeholder (mis. "Test Lead", "(NN)"). Jangan pernah menimpa nama
  // asli yang sudah ada -- confirmedName dari LLM dipercaya sebagai sumber
  // baru, bukan sumber otoritatif kalau sudah ada data lebih baik.
  if (decision.confirmedName && isPlaceholderName(input.currentFirstName)) {
    await supabaseAdmin
      .schema("customer")
      .from("leads")
      .update({ first_name: decision.confirmedName })
      .eq("id", input.leadId);
  }

  // Refresh ringkasan percakapan -- soft-delete note ringkasan lama (kalau
  // ada) lalu insert yang baru, supaya cuma 1 yang aktif per lead ("rolling
  // summary"), dipakai lagi sebagai previousSummary di run berikutnya.
  if (decision.conversationSummary) {
    await supabaseAdmin
      .schema("customer")
      .from("notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("lead_id", input.leadId)
      .eq("author_label", AI_SUMMARY_NOTE_AUTHOR_LABEL)
      .is("deleted_at", null);

    await supabaseAdmin
      .schema("customer")
      .from("notes")
      .insert({
        lead_id: input.leadId,
        note: decision.conversationSummary,
        author_label: AI_SUMMARY_NOTE_AUTHOR_LABEL,
        created_by: null,
      });
  }

  let replySent = false;
  let replyMessageId: string | null = null;

  if (decision.replyText && decision.confidence !== "low") {
    const sendResult = await sendWhatsAppText(input.leadPhone, decision.replyText, input.phoneNumberId);

    if (sendResult.success) {
      const { data: inserted } = await supabaseAdmin
        .schema("chat")
        .from("messages")
        .insert({
          conversation_id: input.conversationId,
          sender_type: "agent",
          sender_id: null,
          content: decision.replyText,
          metadata: { wa_message_id: sendResult.messageId ?? null, message_type: "text", ai_generated: true },
        })
        .select("id")
        .single();

      replySent = true;
      replyMessageId = inserted?.id ?? null;

      await supabaseAdmin.schema("chat").from("conversations").update({ status: "active" }).eq("id", input.conversationId);
    }
  }

  // Kirim foto asli (bukan cuma link teks) kalau AI memutuskan ada foto yang
  // relevan -- sharePhotoUrls sudah disaring di interpretLeadReply() supaya
  // cuma berisi URL yang benar-benar ada di data listing, tidak pernah
  // halusinasi LLM. Kirim satu per satu (WhatsApp/Kapso tidak punya endpoint
  // multi-image sekali kirim); satu foto gagal tidak menggagalkan yang lain.
  for (const photoUrl of decision.sharePhotoUrls) {
    const sendResult = await sendWhatsAppImage(input.leadPhone, photoUrl, undefined, input.phoneNumberId);

    if (sendResult.success) {
      await supabaseAdmin
        .schema("chat")
        .from("messages")
        .insert({
          conversation_id: input.conversationId,
          sender_type: "agent",
          sender_id: null,
          content: photoUrl,
          metadata: { wa_message_id: sendResult.messageId ?? null, message_type: "image", ai_generated: true },
        });
    }
  }

  await supabaseAdmin
    .schema("ai")
    .from("agent_runs")
    .insert({
      lead_id: input.leadId,
      conversation_id: input.conversationId,
      trigger_message_id: input.triggerMessageId,
      input_snapshot: input.inputSnapshot,
      llm_raw_response: input.rawResponse,
      previous_temperature: input.currentTemperature,
      decided_temperature: decision.newTemperature,
      reply_text: decision.replyText,
      reply_sent: replySent,
      reply_message_id: replyMessageId,
      confidence: decision.confidence,
      status: "success",
    });

  // Celah data (mis. AI tidak tahu stok/lokasi spesifik) -- catat sebagai
  // notifikasi buat agen supaya ditindaklanjuti manual, bukan cuma dijawab
  // "akan dicek" ke lead lalu hilang tanpa jejak. Notify agent yang
  // di-assign; kalau lead belum di-assign siapa pun, notify semua admin.
  // Ditampung dulu, BUKAN langsung notifikasi -- percakapan yang berkali-kali
  // mentok dalam 1 sesi chat dulu bikin bubble notifikasi menumpuk (ketemu
  // Yohan: >10 notifikasi terpisah untuk 1 lead dalam <1 jam). Job terjadwal
  // (POST /api/ai/flush-follow-ups, lihat migration 059) gabungkan semua note
  // yang masih pending jadi SATU notifikasi setelah percakapan sepi >=5 menit.
  if (decision.needsFollowUp) {
    await supabaseAdmin
      .schema("ai")
      .from("follow_up_queue")
      .insert({
        lead_id: input.leadId,
        conversation_id: input.conversationId,
        note: decision.followUpNote ?? "Lead menanyakan hal yang tidak bisa dijawab AI Agent dari data yang ada.",
      });
  }
}

/** Dipanggil kalau interpretLeadReply() gagal (API error / format tidak valid) atau lead tidak ditemukan -- tetap dicatat, supaya kegagalan AI Agent juga bisa ditelusuri, bukan diam-diam hilang. */
export async function logAgentRunFailure(
  supabaseAdmin: SupabaseClient<Database>,
  input: {
    leadId: string | null;
    conversationId: string | null;
    triggerMessageId: string | null;
    inputSnapshot: Json;
    rawResponse: Json | null;
    errorMessage: string;
  }
): Promise<void> {
  await supabaseAdmin
    .schema("ai")
    .from("agent_runs")
    .insert({
      lead_id: input.leadId,
      conversation_id: input.conversationId,
      trigger_message_id: input.triggerMessageId,
      input_snapshot: input.inputSnapshot,
      llm_raw_response: input.rawResponse,
      status: "error",
      error_message: input.errorMessage,
    });
}
