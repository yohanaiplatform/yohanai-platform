// src/lib/reports/getAiCreditStatus.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getAiSpendSince } from "@/lib/reports/getAiUsageSummary";

const CRITICAL_DAYS = 3;
const WARN_DAYS = 7;
const STALE_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AiCreditLevel = "ok" | "warn" | "critical" | "unknown";

export interface AiCreditStatus {
  level: AiCreditLevel;
  /** Saldo yang dicatat manual (USD) dan kapan dicatat. */
  balanceUsd: number | null;
  recordedAt: string | null;
  /** Pemakaian AI aplikasi sejak saldo dicatat (taksiran dari ai.agent_runs + ai.llm_usage). */
  spentSinceUsd: number;
  /** Taksiran sisa saldo = saldo tercatat - pemakaian sejak itu (tidak pernah di bawah 0). */
  estimatedRemainingUsd: number | null;
  /** Rata-rata biaya per hari (7 hari terakhir) yang dipakai menghitung sisa hari. */
  avgDailyUsd: number;
  daysLeft: number | null;
  /** Catatan saldo sudah lebih dari STALE_DAYS hari -- minta diperbarui. */
  stale: boolean;
}

/**
 * Taksiran sisa saldo kredit Claude Console. Saldo asli tidak bisa dibaca lewat API (butuh Admin key/akun
 * organisasi), jadi memakai catatan manual terakhir (Settings, admin) dikurangi pemakaian AI sejak dicatat.
 * Taksiran: pemakaian di luar aplikasi (uji coba Console, dll.) tidak terhitung -- catat ulang saldo asli
 * secara berkala supaya taksirannya tidak melenceng.
 */
export async function getAiCreditStatus(
  supabase: SupabaseClient<Database>,
  avgDailyUsd: number
): Promise<AiCreditStatus> {
  const { data: latest } = await supabase
    .schema("ai")
    .from("credit_balance")
    .select("balance_usd, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) {
    return {
      level: "unknown",
      balanceUsd: null,
      recordedAt: null,
      spentSinceUsd: 0,
      estimatedRemainingUsd: null,
      avgDailyUsd,
      daysLeft: null,
      stale: false,
    };
  }

  const balanceUsd = Number(latest.balance_usd);
  const spentSinceUsd = await getAiSpendSince(supabase, latest.recorded_at);
  const estimatedRemainingUsd = Math.max(0, balanceUsd - spentSinceUsd);
  const daysLeft = avgDailyUsd > 0 ? estimatedRemainingUsd / avgDailyUsd : null;
  const stale = Date.now() - new Date(latest.recorded_at).getTime() > STALE_DAYS * DAY_MS;

  let level: AiCreditLevel = "ok";
  if (estimatedRemainingUsd <= 0 || (daysLeft !== null && daysLeft <= CRITICAL_DAYS)) level = "critical";
  else if (daysLeft !== null && daysLeft <= WARN_DAYS) level = "warn";

  return {
    level,
    balanceUsd,
    recordedAt: latest.recorded_at,
    spentSinceUsd,
    estimatedRemainingUsd,
    avgDailyUsd,
    daysLeft,
    stale,
  };
}
