// src/lib/ai/aiPause.ts
// File polos (tanpa "use client") -- dipakai webhook, route API, dan komponen client.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database";

/** Lama AI diam sejak aktivitas manusia terakhir (diperpanjang tiap manusia membalas). */
export const AI_PAUSE_HOURS = 2;

export type AiPauseSource = "manual" | "human_reply";

interface AiPauseState {
  until: string;
  source: AiPauseSource;
}

function asRecord(metadata: unknown): Record<string, Json> {
  return typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? (metadata as Record<string, Json>) : {};
}

/** ISO waktu jeda berakhir kalau AI sedang dijeda untuk lead ini, selain itu null. */
export function getAiPausedUntil(metadata: unknown, now = Date.now()): string | null {
  const pause = asRecord(metadata).ai_pause as unknown as AiPauseState | undefined;
  if (!pause || typeof pause.until !== "string") return null;
  const until = new Date(pause.until).getTime();
  return Number.isFinite(until) && until > now ? pause.until : null;
}

/**
 * Jeda AI untuk satu lead selama AI_PAUSE_HOURS dari sekarang (memperpanjang kalau sudah dijeda).
 * Wajib client service-role. Tidak pernah melempar -- gagal menjeda tidak boleh menghentikan pemanggil.
 */
export async function pauseAiForLead(admin: SupabaseClient, leadId: string, source: AiPauseSource): Promise<string | null> {
  try {
    const { data: lead } = await admin.schema("customer").from("leads").select("metadata").eq("id", leadId).maybeSingle();
    if (!lead) return null;
    const until = new Date(Date.now() + AI_PAUSE_HOURS * 3600 * 1000).toISOString();
    const metadata = { ...asRecord(lead.metadata), ai_pause: { until, source } };
    await admin.schema("customer").from("leads").update({ metadata }).eq("id", leadId);
    return until;
  } catch (err) {
    console.error(`[ai-pause] gagal menjeda AI untuk lead ${leadId}:`, err);
    return null;
  }
}

/** Kembalikan percakapan ke AI (hapus jeda). */
export async function resumeAiForLead(admin: SupabaseClient, leadId: string): Promise<boolean> {
  try {
    const { data: lead } = await admin.schema("customer").from("leads").select("metadata").eq("id", leadId).maybeSingle();
    if (!lead) return false;
    const metadata = asRecord(lead.metadata);
    delete metadata.ai_pause;
    await admin.schema("customer").from("leads").update({ metadata }).eq("id", leadId);
    return true;
  } catch (err) {
    console.error(`[ai-pause] gagal mengembalikan ke AI untuk lead ${leadId}:`, err);
    return false;
  }
}
