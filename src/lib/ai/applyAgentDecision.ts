// src/lib/ai/applyAgentDecision.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { sendWhatsAppText } from "@/lib/whatsapp/kapso";
import type { AgentDecision } from "@/lib/ai/interpretLeadReply";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAdminUserIds } from "@/lib/notifications/getAdminUserIds";

export interface ApplyAgentDecisionInput {
  leadId: string;
  leadName: string;
  leadPhone: string;
  assignedTo: string | null;
  conversationId: string;
  triggerMessageId: string | null;
  currentMetadata: Json;
  currentTemperature: string | null;
  decision: AgentDecision;
  inputSnapshot: Json;
  rawResponse: Json | null;
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

  if (decision.newTemperature && decision.newTemperature !== input.currentTemperature) {
    const baseMetadata =
      typeof input.currentMetadata === "object" && input.currentMetadata !== null && !Array.isArray(input.currentMetadata)
        ? (input.currentMetadata as Record<string, Json>)
        : {};

    await supabaseAdmin
      .schema("customer")
      .from("leads")
      .update({ metadata: { ...baseMetadata, status_funnel_awal: decision.newTemperature } })
      .eq("id", input.leadId);
  }

  let replySent = false;
  let replyMessageId: string | null = null;

  if (decision.replyText && decision.confidence !== "low") {
    const sendResult = await sendWhatsAppText(input.leadPhone, decision.replyText);

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
  if (decision.needsFollowUp) {
    const recipientIds = input.assignedTo
      ? [input.assignedTo]
      : (await getAdminUserIds(supabaseAdmin)).map((a) => a.userId);

    await Promise.all(
      recipientIds.map((recipientId) =>
        createNotification(supabaseAdmin, {
          recipientId,
          type: "ai_agent_needs_follow_up",
          title: `AI Agent butuh follow-up: ${input.leadName}`,
          body: decision.followUpNote ?? "Lead menanyakan hal yang tidak bisa dijawab AI Agent dari data yang ada.",
          link: `/crm/${input.leadId}`,
          metadata: { leadId: input.leadId, agentRunReasoning: decision.reasoning },
        })
      )
    );
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
