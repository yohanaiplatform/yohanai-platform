// src/app/api/whatsapp/send/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/whatsapp/kapso";
import { findOrCreateLeadConversation } from "@/lib/chat/conversations";
import { getPhoneNumberIdForUser } from "@/lib/whatsapp/whatsappNumbers";
import { createAdminClient } from "@/lib/supabase/admin";
import { pauseAiForLead } from "@/lib/ai/aiPause";

/**
 * Kirim balasan WhatsApp keluar dari Lead Detail. Diamankan lewat sesi
 * login (bukan secret header) -- dipanggil dari browser oleh agent/admin
 * yang sedang login, bukan mesin. RLS `leads_owner_or_admin` di
 * customer.leads otomatis membatasi: agent cuma bisa kirim ke lead yang
 * memang jadi tanggung jawabnya.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { leadId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = body.leadId;
  const message = body.message?.trim();

  if (!leadId || !message) {
    return NextResponse.json(
      { error: "leadId dan message wajib diisi" },
      { status: 400 }
    );
  }

  const { data: lead, error: leadError } = await supabase
    .schema("customer")
    .from("leads")
    .select("id, phone, first_name, last_name, assigned_to")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead || !lead.phone) {
    return NextResponse.json(
      { error: "Lead tidak ditemukan atau tidak punya nomor HP" },
      { status: 404 }
    );
  }

  // Tentukan nomor WA pengirim SEBELUM kirim -- WhatsApp Business API
  // mengharuskan balasan dari nomor yang sama dengan yang di-chat lead.
  // Prioritas: (1) percakapan yang sudah ada (lead ini sudah pernah chat ke
  // nomor tertentu, ambil dari metadata.phone_number_id -- lihat migration
  // 056), (2) kalau belum pernah ada percakapan sama sekali (agent kirim
  // pesan PERTAMA duluan), fallback ke nomor terdaftar milik agent yang
  // di-assign ke lead ini (chat.whatsapp_numbers).
  const { data: existingConversation } = await supabase
    .schema("chat")
    .from("conversations")
    .select("metadata")
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingMetadata = (existingConversation?.metadata ?? {}) as Record<string, unknown>;
  const conversationPhoneNumberId = typeof existingMetadata.phone_number_id === "string" ? existingMetadata.phone_number_id : null;

  const phoneNumberId =
    conversationPhoneNumberId ?? (lead.assigned_to ? await getPhoneNumberIdForUser(supabase, lead.assigned_to) : null);

  const sendResult = await sendWhatsAppText(lead.phone, message, phoneNumberId);

  if (!sendResult.success) {
    return NextResponse.json(
      { error: sendResult.error ?? "Gagal mengirim pesan" },
      { status: 502 }
    );
  }

  const fallbackTitle = `${lead.first_name} ${lead.last_name}`.trim() || lead.phone;
  const conversationId = await findOrCreateLeadConversation(supabase, leadId, fallbackTitle, phoneNumberId);

  let savedMessage: { id: string; sender_type: string; content: string; created_at: string } | null = null;

  if (conversationId) {
    const { data: inserted } = await supabase
      .schema("chat")
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "agent",
        sender_id: user.id,
        content: message,
        metadata: { wa_message_id: sendResult.messageId ?? null, message_type: "text" },
      })
      .select("id, sender_type, content, created_at")
      .single();

    savedMessage = inserted ?? null;

    await supabase
      .schema("chat")
      .from("conversations")
      .update({ status: "active" })
      .eq("id", conversationId);
  }

  // Manusia ikut membalas dari dashboard -> AI diam 2 jam supaya tidak menimpa/menyela jawaban agen.
  await pauseAiForLead(createAdminClient(), leadId, "human_reply");

  return NextResponse.json({ success: true, conversationId, message: savedMessage });
}
