// src/app/api/whatsapp/send/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/whatsapp/kapso";
import { findOrCreateLeadConversation } from "@/lib/chat/conversations";

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
    .select("id, phone, first_name, last_name")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead || !lead.phone) {
    return NextResponse.json(
      { error: "Lead tidak ditemukan atau tidak punya nomor HP" },
      { status: 404 }
    );
  }

  const sendResult = await sendWhatsAppText(lead.phone, message);

  if (!sendResult.success) {
    return NextResponse.json(
      { error: sendResult.error ?? "Gagal mengirim pesan" },
      { status: 502 }
    );
  }

  const fallbackTitle = `${lead.first_name} ${lead.last_name}`.trim() || lead.phone;
  const conversationId = await findOrCreateLeadConversation(supabase, leadId, fallbackTitle);

  if (conversationId) {
    await supabase
      .schema("chat")
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "agent",
        sender_id: user.id,
        content: message,
        metadata: { wa_message_id: sendResult.messageId ?? null, message_type: "text" },
      });

    await supabase
      .schema("chat")
      .from("conversations")
      .update({ status: "active" })
      .eq("id", conversationId);
  }

  return NextResponse.json({ success: true });
}
