// src/lib/reports/getPlatformReport.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface PlatformReport {
  generatedAt: string;
  users: { total: number };
  leads: { total: number; newThisWeek: number };
  listings: { total: number; newThisWeek: number };
  supabase: {
    dbSizeBytes: number;
    storageSizeBytes: number;
    storageObjectCount: number;
  };
  resend: {
    /** Perkiraan -- Resend tidak punya endpoint total kirim, dihitung dari 100 email
     * terakhir yang tercatat. Kalau persis 100, kemungkinan ada yang tidak terhitung. */
    sentRecentApprox: number;
    approxCapped: boolean;
    error: string | null;
  };
  vercel: {
    configured: boolean;
    lastDeploymentState: string | null;
    lastDeploymentAt: string | null;
    lastDeploymentRegion: string | null;
    error: string | null;
  };
}

const SUPABASE_FREE_DB_LIMIT_BYTES = 500 * 1024 * 1024;
const SUPABASE_FREE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const R2_FREE_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
const RESEND_FREE_MONTHLY_LIMIT = 3000;

export { SUPABASE_FREE_DB_LIMIT_BYTES, SUPABASE_FREE_STORAGE_LIMIT_BYTES, R2_FREE_STORAGE_LIMIT_BYTES, RESEND_FREE_MONTHLY_LIMIT };

async function getResendUsage(): Promise<PlatformReport["resend"]> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sentRecentApprox: 0, approxCapped: false, error: "RESEND_API_KEY belum dikonfigurasi." };

  const res = await fetch("https://api.resend.com/emails?limit=100", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    return { sentRecentApprox: 0, approxCapped: false, error: `Resend API error (${res.status})` };
  }

  const body = await res.json();
  const emails: Array<{ created_at: string }> = body.data ?? [];

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const thisMonth = emails.filter((e) => new Date(e.created_at).getTime() >= startOfMonth.getTime());

  return { sentRecentApprox: thisMonth.length, approxCapped: emails.length >= 100, error: null };
}

async function getVercelStatus(): Promise<PlatformReport["vercel"]> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return { configured: false, lastDeploymentState: null, lastDeploymentAt: null, lastDeploymentRegion: null, error: null };
  }

  const url = new URL("https://api.vercel.com/v6/deployments");
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("target", "production");
  url.searchParams.set("limit", "1");
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });

  if (!res.ok) {
    return {
      configured: true,
      lastDeploymentState: null,
      lastDeploymentAt: null,
      lastDeploymentRegion: null,
      error: `Vercel API error (${res.status})`,
    };
  }

  const body = await res.json();
  const deployment = body.deployments?.[0];

  if (!deployment) {
    return { configured: true, lastDeploymentState: null, lastDeploymentAt: null, lastDeploymentRegion: null, error: null };
  }

  return {
    configured: true,
    lastDeploymentState: deployment.state ?? deployment.readyState ?? null,
    lastDeploymentAt: deployment.created ? new Date(deployment.created).toISOString() : null,
    lastDeploymentRegion: deployment.regions?.[0] ?? null,
    error: null,
  };
}

/**
 * Laporan untuk Yohan sebagai pengembang (bukan sebagai pemilik bisnis) --
 * agregat platform-wide (bukan per-agent seperti getDailyReport.ts), plus
 * kesehatan infrastruktur (Supabase, Resend, Vercel) dibanding limit Free
 * Tier masing-masing. Dikirim terpisah ke admin@yohanai.id, tidak lewat
 * preferensi notifikasi user manapun -- lihat sendPlatformReportEmail.ts.
 */
export async function getPlatformReport(supabase: SupabaseClient<Database>): Promise<PlatformReport> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usersResult, leadsTotal, leadsWeek, listingsTotal, listingsWeek, platformStats, resendUsage, vercelStatus] =
    await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.schema("customer").from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase
        .schema("customer")
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo)
        .is("deleted_at", null),
      supabase.schema("property").from("listings").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase
        .schema("property")
        .from("listings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo)
        .is("deleted_at", null),
      supabase.schema("core").rpc("get_platform_stats"),
      getResendUsage(),
      getVercelStatus(),
    ]);

  const stats = platformStats.data?.[0];

  return {
    generatedAt: new Date().toISOString(),
    users: { total: usersResult.data?.users.length ?? 0 },
    leads: { total: leadsTotal.count ?? 0, newThisWeek: leadsWeek.count ?? 0 },
    listings: { total: listingsTotal.count ?? 0, newThisWeek: listingsWeek.count ?? 0 },
    supabase: {
      dbSizeBytes: stats?.db_size_bytes ?? 0,
      storageSizeBytes: stats?.storage_size_bytes ?? 0,
      storageObjectCount: stats?.storage_object_count ?? 0,
    },
    resend: resendUsage,
    vercel: vercelStatus,
  };
}
