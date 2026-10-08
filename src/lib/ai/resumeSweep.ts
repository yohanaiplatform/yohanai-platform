// src/lib/ai/resumeSweep.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import { runAiAgent } from "@/lib/ai/runAiAgent";
import { resumeAiForLead } from "@/lib/ai/aiPause";

const LOOKBACK_HOURS = 3;
const MAX_PER_RUN = 5;
const TEXT_TYPES = new Set(["text", "button", "interactive"]);

export interface ResumeSweepResult {
  expired: number;
  answered: number;
  skipped: number;
}

/**
 * Setelah jeda AI berakhir, pesan lead yang masuk SELAMA jeda dan belum dibalas siapa pun (manusia pergi, AI diam)
 * dijawab AI -- supaya lead tidak menggantung berjam-jam sampai pesan berikutnya (ketemu 8 Okt). Dipanggil tiap jam
 * dari /api/cron/hourly. Hanya jeda yang berakhir dalam ${LOOKBACK_HOURS} jam terakhir; tanda jeda dibersihkan setelah diperiksa
 * sehingga tidak diproses dua kali. Hanya bila pesan TERAKHIR di percakapan dari lead (belum ada balasan sesudahnya).
 */
export async function resumeUnansweredAfterPause(supabase: SupabaseClient, now = new Date()): Promise<ResumeSweepResult> {
  const result: ResumeSweepResult = { expired: 0, answered: 0, skipped: 0 };
  if (!process.env.ANTHROPIC_API_KEY) return result;

  const since = new Date(now.getTime() - LOOKBACK_HOURS * 3600 * 1000).toISOString();
  const { data: leads } = await supabase
    .schema("customer")
    .from("leads")
    .select("id, phone")
    .is("deleted_at", null)
    .gte("metadata->ai_pause->>until", since)
    .lt("metadata->ai_pause->>until", now.toISOString())
    .limit(30);

  for (const lead of leads ?? []) {
    result.expired += 1;

    const { data: conversation } = await supabase
      .schema("chat")
      .from("conversations")
      .select("id, metadata")
      .eq("lead_id", lead.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let handled = false;
    if (conversation && result.answered < MAX_PER_RUN) {
      const { data: last } = await supabase
        .schema("chat")
        .from("messages")
        .select("id, sender_type, content, metadata, created_at")
        .eq("conversation_id", conversation.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastMeta = (last?.metadata ?? {}) as Record<string, unknown>;
      const lastIsOpenLeadText =
        last?.sender_type === "customer" &&
        TEXT_TYPES.has(String(lastMeta.message_type ?? "text")) &&
        Date.now() - new Date(last.created_at).getTime() < (LOOKBACK_HOURS + 3) * 3600 * 1000;

      if (last && lastIsOpenLeadText) {
        // Tanda jeda dibersihkan DULU supaya run ini tidak menganggap dirinya masih dijeda.
        await resumeAiForLead(supabase, lead.id);
        const convMeta = (conversation.metadata ?? {}) as Record<string, unknown>;
        const phoneNumberId = typeof convMeta.phone_number_id === "string" ? convMeta.phone_number_id : null;
        try {
          await runAiAgent(supabase as Parameters<typeof runAiAgent>[0], lead.id, conversation.id, last.id, last.content, phoneNumberId);
          result.answered += 1;
        } catch (err) {
          console.error(`[resume-sweep] gagal menjawab lead ${lead.id}:`, err);
        }
        handled = true;
      }
    }

    if (!handled) {
      result.skipped += 1;
      await resumeAiForLead(supabase, lead.id);
    }
  }

  return result;
}
