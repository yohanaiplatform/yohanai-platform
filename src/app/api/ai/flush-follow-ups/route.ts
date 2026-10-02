// src/app/api/ai/flush-follow-ups/route.ts

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/createNotification";
import { getAdminUserIds } from "@/lib/notifications/getAdminUserIds";
import { sendWhatsAppText } from "@/lib/whatsapp/kapso";
import { formatFollowUpSummary } from "@/lib/ai/followUpFormatting";

const QUIET_MINUTES = 5;
const APP_URL = "https://yohanai.id";

/**
 * Dipanggil GitHub Actions cron (.github/workflows/flush-follow-ups.yml)
 * tiap 5 menit -- diamankan lewat secret header, pola sama persis seperti
 * GET /api/reports/daily.
 *
 * Gabungkan ai.follow_up_queue (migration 059) per lead jadi SATU
 * notifikasi, tapi CUMA untuk lead yang percakapannya sudah sepi >=5 menit
 * (belum ada pesan baru sama sekali) -- lead yang masih aktif chat
 * ditunda ke run berikutnya, supaya follow-up dari sesi yang masih
 * berlangsung ikut tertampung jadi 1 ringkasan, bukan flush setengah jalan.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-flush-secret");
  if (!secret || secret !== process.env.AI_FOLLOW_UP_FLUSH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pending } = await supabase
    .schema("ai")
    .from("follow_up_queue")
    .select("id, lead_id, conversation_id, note")
    .is("flushed_at", null);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ flushed: 0, pendingLeads: 0 });
  }

  const leadIds = Array.from(new Set(pending.map((p) => p.lead_id)));
  let flushedCount = 0;

  for (const leadId of leadIds) {
    const items = pending.filter((p) => p.lead_id === leadId);
    const conversationId = items.find((i) => i.conversation_id)?.conversation_id ?? null;

    if (conversationId) {
      const { data: lastMessage } = await supabase
        .schema("chat")
        .from("messages")
        .select("created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMessage) {
        const quietMs = Date.now() - new Date(lastMessage.created_at).getTime();
        if (quietMs < QUIET_MINUTES * 60 * 1000) continue;
      }
    }

    const { data: lead } = await supabase
      .schema("customer")
      .from("leads")
      .select("first_name, last_name, slug, assigned_to")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead) continue;

    const leadName = `${lead.first_name} ${lead.last_name}`.trim() || "Lead";
    const leadUrl = `${APP_URL}/crm/${lead.slug}`;
    const summary = formatFollowUpSummary(
      leadName,
      items.map((i) => i.note),
      leadUrl
    );

    const recipientIds = lead.assigned_to
      ? [lead.assigned_to]
      : (await getAdminUserIds(supabase)).map((a) => a.userId);

    await Promise.all(
      recipientIds.map((recipientId) =>
        createNotification(supabase, {
          recipientId,
          type: "ai_agent_needs_follow_up",
          title: `AI Agent butuh follow-up: ${leadName}`,
          body: summary,
          link: `/crm/${lead.slug}`,
          metadata: { leadId, itemCount: items.length },
        })
      )
    );

    // Kirim juga ke nomor WA notifikasi personal tiap recipient, kalau
    // sudah diisi di Profile (field terpisah dari nomor WA bisnis).
    const { data: profiles } = await supabase
      .schema("auth_ext")
      .from("profiles")
      .select("user_id, notification_whatsapp_number")
      .in("user_id", recipientIds);

    await Promise.all(
      (profiles ?? [])
        .filter((p): p is { user_id: string; notification_whatsapp_number: string } => Boolean(p.notification_whatsapp_number))
        .map((p) => sendWhatsAppText(p.notification_whatsapp_number, summary).catch(() => null))
    );

    const idsToFlush = items.map((i) => i.id);
    await supabase.schema("ai").from("follow_up_queue").update({ flushed_at: new Date().toISOString() }).in("id", idsToFlush);

    flushedCount += 1;
  }

  return NextResponse.json({ flushed: flushedCount, pendingLeads: leadIds.length });
}
