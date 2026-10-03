// src/app/api/ai/send-digest/route.ts

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp/kapso";
import { AI_SUMMARY_NOTE_AUTHOR_LABEL } from "@/lib/ai/applyAgentDecision";

const APP_URL = "https://yohanai.id";
const MAX_LEADS_PER_DIGEST = 15;
const GIST_MAX = 90;
const WIB_OFFSET_HOURS = 7;

/** Slot kirim (jam WIB) -- pagi mencakup sejak malam sebelumnya. */
const SLOTS_WIB = [8, 13, 21];

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Awal jendela rangkuman: slot sebelumnya relatif ke slot yang sedang berjalan. */
function getWindowStart(now: Date): Date {
  const wibNow = new Date(now.getTime() + WIB_OFFSET_HOURS * 3600 * 1000);
  const hour = wibNow.getUTCHours() + wibNow.getUTCMinutes() / 60;

  // Slot terdekat (cron bisa telat/lebih awal beberapa menit-jam).
  let currentSlot = SLOTS_WIB[0];
  let bestDiff = Infinity;
  for (const slot of SLOTS_WIB) {
    const diff = Math.abs(hour - slot);
    if (diff < bestDiff) {
      bestDiff = diff;
      currentSlot = slot;
    }
  }

  const slotIndex = SLOTS_WIB.indexOf(currentSlot);
  const previousSlot = SLOTS_WIB[(slotIndex + SLOTS_WIB.length - 1) % SLOTS_WIB.length];
  const hoursBack = (currentSlot - previousSlot + 24) % 24 || 24;

  return new Date(now.getTime() - hoursBack * 3600 * 1000);
}

/**
 * Rangkuman 3x sehari (08:00, 13:00, 21:00 WIB) -- dipanggil GitHub Actions
 * (.github/workflows/ai-digest.yml), diamankan secret header yang sama
 * dengan flush-follow-ups. Per agen: SEMUA lead miliknya yang mengirim pesan
 * di jendela itu, 1 baris per lead (nama, nomor, inti singkat) -- bukan
 * ulang tiap bubble chat. Tidak dikirim kalau jendela itu sepi.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-flush-secret");
  if (!secret || secret !== process.env.AI_FOLLOW_UP_FLUSH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Dipanggil TIAP JAM oleh cron eksternal (cron-job.org), tapi hanya bertindak
  // di jam slot (08, 13, 21 WIB) -- supaya jadwal di sisi cron cukup "tiap jam"
  // tanpa perlu jam kustom. `?force=1` melewati pengecekan jam (untuk tes manual).
  const wibHour = (now.getUTCHours() + WIB_OFFSET_HOURS) % 24;
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (!force && !SLOTS_WIB.includes(wibHour)) {
    return NextResponse.json({ skipped: true, reason: "bukan jam kirim", wibHour });
  }

  const supabase = createAdminClient();
  const since = getWindowStart(now).toISOString();

  const { data: inbound } = await supabase
    .schema("chat")
    .from("messages")
    .select("content, created_at, conversation_id")
    .eq("sender_type", "customer")
    .is("deleted_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (!inbound || inbound.length === 0) {
    return NextResponse.json({ sent: 0, leads: 0 });
  }

  const conversationIds = Array.from(new Set(inbound.map((m) => m.conversation_id)));
  const { data: conversations } = await supabase
    .schema("chat")
    .from("conversations")
    .select("id, lead_id")
    .in("id", conversationIds);

  const leadByConversation = new Map((conversations ?? []).map((c) => [c.id, c.lead_id]));
  const lastMessageByLead = new Map<string, string>();
  for (const message of inbound) {
    const leadId = leadByConversation.get(message.conversation_id);
    if (leadId && !lastMessageByLead.has(leadId)) lastMessageByLead.set(leadId, message.content);
  }

  const leadIds = Array.from(lastMessageByLead.keys());
  if (leadIds.length === 0) return NextResponse.json({ sent: 0, leads: 0 });

  const [{ data: leads }, { data: summaryNotes }, { data: queued }] = await Promise.all([
    supabase.schema("customer").from("leads").select("id, first_name, last_name, phone, slug, assigned_to").in("id", leadIds),
    supabase
      .schema("customer")
      .from("notes")
      .select("lead_id, note")
      .in("lead_id", leadIds)
      .eq("author_label", AI_SUMMARY_NOTE_AUTHOR_LABEL)
      .is("deleted_at", null),
    supabase.schema("ai").from("follow_up_queue").select("lead_id").in("lead_id", leadIds).gte("created_at", since),
  ]);

  const summaryByLead = new Map((summaryNotes ?? []).map((n) => [n.lead_id, n.note]));
  const needsFollowUp = new Set((queued ?? []).map((q) => q.lead_id));

  const leadsByAgent = new Map<string, NonNullable<typeof leads>>();
  for (const lead of leads ?? []) {
    if (!lead.assigned_to) continue;
    const list = leadsByAgent.get(lead.assigned_to) ?? [];
    list.push(lead);
    leadsByAgent.set(lead.assigned_to, list);
  }

  const { data: profiles } = await supabase
    .schema("auth_ext")
    .from("profiles")
    .select("user_id, notification_whatsapp_number")
    .in("user_id", Array.from(leadsByAgent.keys()));

  let sentCount = 0;

  for (const profile of profiles ?? []) {
    if (!profile.notification_whatsapp_number) continue;
    const agentLeads = leadsByAgent.get(profile.user_id) ?? [];
    if (agentLeads.length === 0) continue;

    // Yang butuh follow-up manusia dulu, sisanya urut nama.
    const sorted = [...agentLeads].sort(
      (a, b) => Number(needsFollowUp.has(b.id)) - Number(needsFollowUp.has(a.id))
    );
    const shown = sorted.slice(0, MAX_LEADS_PER_DIGEST);

    const lines = shown.map((lead) => {
      const name = `${lead.first_name} ${lead.last_name}`.trim() || "Tanpa nama";
      const gistSource = summaryByLead.get(lead.id) ?? lastMessageByLead.get(lead.id) ?? "";
      const flag = needsFollowUp.has(lead.id) ? "⚠️ " : "";
      return `- ${flag}*${name}* (${lead.phone ?? "-"})${gistSource ? ` — ${truncate(gistSource, GIST_MAX)}` : ""}`;
    });

    const more = sorted.length - shown.length;
    const message = [
      `*Rangkuman chat — ${agentLeads.length} konsumen*`,
      "",
      ...lines,
      ...(more > 0 ? [`+${more} lainnya`] : []),
      "",
      "⚠️ = perlu follow-up Anda",
      `${APP_URL}/crm`,
    ].join("\n");

    const result = await sendWhatsAppText(profile.notification_whatsapp_number, message).catch(() => null);
    if (result?.success) sentCount += 1;
  }

  return NextResponse.json({ sent: sentCount, leads: leadIds.length });
}
