// src/lib/knowledge/getConversationInsights.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const DAYS = 7;
const TOP_N = 5;

export interface InsightCount {
  label: string;
  count: number;
}

export interface ConversationInsights {
  days: number;
  totalLeads: number;
  temperature: InsightCount[];
  minatLokasi: InsightCount[];
  datangDari: InsightCount[];
  sumber: InsightCount[];
}

function topCounts(values: (string | null | undefined)[], limit = TOP_N): InsightCount[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Knowledge Loop langkah 5 (v1): ringkasan pola lead 7 hari terakhir dari data yang sudah ada
 * (metadata lead) -- apa yang paling dicari, dari postingan/iklan mana datangnya, dan di tahap
 * Temperature mana mereka. Mengikuti RLS sesi (agen hanya melihat leadnya sendiri).
 */
export async function getConversationInsights(supabase: SupabaseClient<Database>): Promise<ConversationInsights> {
  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString();

  const { data } = await supabase
    .schema("customer")
    .from("leads")
    .select("metadata")
    .gte("created_at", since)
    .is("deleted_at", null)
    .limit(2000);

  const metadatas = (data ?? []).map((row) =>
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}
  );

  const str = (v: unknown) => (typeof v === "string" ? v : null);

  const datangDariLabels = metadatas.map((m) => {
    const dd = m.datang_dari;
    if (!dd || typeof dd !== "object" || Array.isArray(dd)) return null;
    const r = dd as Record<string, unknown>;
    const parts = [str(r.platform), str(r.judul)].filter(Boolean);
    const isi = str(r.isi);
    return `${parts.join(" - ") || "Postingan/iklan"}${isi ? ` (${isi.slice(0, 50)})` : ""}`;
  });

  return {
    days: DAYS,
    totalLeads: metadatas.length,
    temperature: topCounts(metadatas.map((m) => str(m.status_funnel_awal) ?? "Belum dinilai"), 6),
    minatLokasi: topCounts(metadatas.map((m) => str(m.minat_unit_lokasi))),
    datangDari: topCounts(datangDariLabels),
    sumber: topCounts(metadatas.map((m) => str(m.sumber_informasi))),
  };
}
