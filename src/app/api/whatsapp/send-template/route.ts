// src/app/api/whatsapp/send-template/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/kapso";
import { findOrCreateLeadConversation } from "@/lib/chat/conversations";
import { getPhoneNumberIdForUser } from "@/lib/whatsapp/whatsappNumbers";

import { FOLLOW_UP_TEMPLATES, DEFAULT_FOLLOW_UP_TEMPLATE } from "@/lib/whatsapp/followUpTemplates";

/**
 * Kirim template follow-up (yohan_griya) ke lead dari Lead Detail -- untuk
 * lead yang sudah lewat jendela 24 jam WhatsApp. Pola otorisasi & pemilihan
 * nomor pengirim sama seperti /api/whatsapp/send (sesi login + RLS leads).
 * Template berbayar per pesan (Meta), jadi sengaja manual per klik, bukan cron.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { leadId?: string; templateName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.leadId) {
    return NextResponse.json({ error: "leadId wajib diisi" }, { status: 400 });
  }

  // Hanya template di daftar putih -- jangan percaya nama template dari client.
  const FOLLOW_UP_TEMPLATE = FOLLOW_UP_TEMPLATES.find((tpl) => tpl.name === (body.templateName ?? DEFAULT_FOLLOW_UP_TEMPLATE));
  if (!FOLLOW_UP_TEMPLATE) {
    return NextResponse.json({ error: "Template tidak dikenal" }, { status: 400 });
  }

  const { data: lead, error: leadError } = await supabase
    .schema("customer")
    .from("leads")
    .select("id, phone, first_name, last_name, assigned_to")
    .eq("id", body.leadId)
    .maybeSingle();

  if (leadError || !lead || !lead.phone) {
    return NextResponse.json(
      { error: "Lead tidak ditemukan atau tidak punya nomor HP" },
      { status: 404 }
    );
  }

  const { data: existingConversation } = await supabase
    .schema("chat")
    .from("conversations")
    .select("metadata")
    .eq("lead_id", lead.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingMetadata = (existingConversation?.metadata ?? {}) as Record<string, unknown>;
  const conversationPhoneNumberId =
    typeof existingMetadata.phone_number_id === "string" ? existingMetadata.phone_number_id : null;

  const phoneNumberId =
    conversationPhoneNumberId ?? (lead.assigned_to ? await getPhoneNumberIdForUser(supabase, lead.assigned_to) : null);

  const sendResult = await sendWhatsAppTemplate(
    lead.phone,
    FOLLOW_UP_TEMPLATE.name,
    FOLLOW_UP_TEMPLATE.language,
    phoneNumberId
  );

  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.error ?? "Gagal mengirim template" }, { status: 502 });
  }

  const fallbackTitle = `${lead.first_name} ${lead.last_name}`.trim() || lead.phone;
  const conversationId = await findOrCreateLeadConversation(supabase, lead.id, fallbackTitle, phoneNumberId);

  let savedMessage: { id: string; sender_type: string; content: string; created_at: string } | null = null;

  if (conversationId) {
    const { data: inserted } = await supabase
      .schema("chat")
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "agent",
        sender_id: user.id,
        content: `[Template follow-up terkirim: ${FOLLOW_UP_TEMPLATE.name}]`,
        metadata: { wa_message_id: sendResult.messageId ?? null, message_type: "template" },
      })
      .select("id, sender_type, content, created_at")
      .single();

    savedMessage = inserted ?? null;

    await supabase.schema("chat").from("conversations").update({ status: "active" }).eq("id", conversationId);
  }

  return NextResponse.json({ success: true, conversationId, message: savedMessage });
}
