// src/lib/admin/recordPlatformSnapshot.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getAiSpendSince } from "@/lib/reports/getAiUsageSummary";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Simpan/perbarui potret metrik platform untuk HARI INI (tanggal WIB): total pengguna/lead/listing, ukuran database
 * dan storage, pesan + biaya AI hari ini. Upsert -- dipanggil beberapa kali sehari dari cron, nilai terakhir hari itu
 * yang tersisa. Dasar tren bulanan/tahunan untuk metrik yang tidak bisa dihitung ulang dari data lama.
 * Wajib service-role. Tidak pernah melempar.
 */
export async function recordPlatformSnapshot(admin: SupabaseClient<Database>, now = new Date()): Promise<{ date: string } | { error: string }> {
  try {
    const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
    const date = wibNow.toISOString().slice(0, 10);
    const startOfDayUtc = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()) - WIB_OFFSET_MS).toISOString();

    const [users, leads, listings, stats, runs, spend] = await Promise.all([
      admin.auth.admin.listUsers(),
      admin.schema("customer").from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
      admin.schema("property").from("listings").select("id", { count: "exact", head: true }).is("deleted_at", null),
      admin.schema("core").rpc("get_platform_stats"),
      admin
        .schema("ai")
        .from("agent_runs")
        .select("id", { count: "exact", head: true })
        .eq("status", "success")
        .gte("created_at", startOfDayUtc),
      getAiSpendSince(admin, startOfDayUtc),
    ]);

    const s = stats.data?.[0];
    const { error } = await admin
      .schema("core")
      .from("platform_snapshots")
      .upsert({
        snapshot_date: date,
        users_total: users.data?.users.length ?? null,
        leads_total: leads.count ?? null,
        listings_total: listings.count ?? null,
        db_size_bytes: s?.db_size_bytes ?? null,
        storage_size_bytes: s?.storage_size_bytes ?? null,
        ai_messages: runs.count ?? 0,
        ai_cost_usd: Math.round(spend * 10000) / 10000,
        updated_at: new Date().toISOString(),
      });
    if (error) return { error: error.message };
    return { date };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "gagal" };
  }
}
