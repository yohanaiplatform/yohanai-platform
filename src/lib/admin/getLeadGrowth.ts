// src/lib/admin/getLeadGrowth.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE = 1000;

export interface GrowthPoint {
  label: string;
  value: number;
}

export interface LeadGrowth {
  total: number;
  last7: number;
  prev7: number;
  last30: number;
  perDay: GrowthPoint[];
  perWeek: GrowthPoint[];
  perMonth: GrowthPoint[];
  bySource30: GrowthPoint[];
}

/** Tanggal kalender WIB (YYYY-MM-DD) dari timestamp. */
function wibDate(ms: number): string {
  return new Date(ms + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Senin (WIB) awal minggu dari tanggal WIB. */
function weekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Senin = 0
  return new Date(d.getTime() - dow * DAY_MS).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const shortDate = (dateStr: string) => `${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}`;

/**
 * Pertumbuhan lead (semua agen, tidak terhapus): total, 7/30 hari, per hari (30 hari), per minggu (12 minggu),
 * per bulan (sejak lead pertama), dan sumber 30 hari terakhir. Dihitung dari customer.leads.created_at -- lead hasil
 * migrasi spreadsheet punya tanggal asli, jadi grafik bulanan mencerminkan riwayat sebenarnya. Wajib service-role.
 */
export async function getLeadGrowth(admin: SupabaseClient<Database>, now = Date.now()): Promise<LeadGrowth> {
  const rows: { created_at: string; lead_source_id: string | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await admin
      .schema("customer")
      .from("leads")
      .select("created_at, lead_source_id")
      .is("deleted_at", null)
      .order("created_at")
      .range(from, from + PAGE - 1);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }

  const { data: sources } = await admin.schema("customer").from("lead_sources").select("id, name");
  const sourceName = new Map((sources ?? []).map((s) => [s.id, s.name]));

  const today = wibDate(now);
  const perDayMap = new Map<string, number>();
  const perWeekMap = new Map<string, number>();
  const perMonthMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();

  let last7 = 0;
  let prev7 = 0;
  let last30 = 0;

  for (const row of rows) {
    const ms = new Date(row.created_at).getTime();
    const day = wibDate(ms);
    const ageDays = Math.floor((now + WIB_OFFSET_MS) / DAY_MS) - Math.floor((ms + WIB_OFFSET_MS) / DAY_MS);

    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
    const wk = weekStart(day);
    perWeekMap.set(wk, (perWeekMap.get(wk) ?? 0) + 1);
    const mo = day.slice(0, 7);
    perMonthMap.set(mo, (perMonthMap.get(mo) ?? 0) + 1);

    if (ageDays >= 0 && ageDays < 7) last7 += 1;
    else if (ageDays >= 7 && ageDays < 14) prev7 += 1;
    if (ageDays >= 0 && ageDays < 30) {
      last30 += 1;
      const name = (row.lead_source_id && sourceName.get(row.lead_source_id)) || "Tanpa sumber";
      sourceMap.set(name, (sourceMap.get(name) ?? 0) + 1);
    }
  }

  const perDay: GrowthPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = wibDate(now - i * DAY_MS);
    perDay.push({ label: shortDate(d), value: perDayMap.get(d) ?? 0 });
  }

  const perWeek: GrowthPoint[] = [];
  const thisWeek = weekStart(today);
  for (let i = 11; i >= 0; i--) {
    const w = new Date(new Date(`${thisWeek}T00:00:00Z`).getTime() - i * 7 * DAY_MS).toISOString().slice(0, 10);
    perWeek.push({ label: shortDate(w), value: perWeekMap.get(w) ?? 0 });
  }

  const perMonth: GrowthPoint[] = [...perMonthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, value]) => ({ label: `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`, value }));

  const bySource30 = [...sourceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  return { total: rows.length, last7, prev7, last30, perDay, perWeek, perMonth, bySource30 };
}
