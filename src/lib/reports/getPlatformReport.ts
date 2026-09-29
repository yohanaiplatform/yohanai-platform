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
    lastDeploymentInspectorUrl: string | null;
    error: string | null;
  };
  integrations: IntegrationStatus[];
}

export type IntegrationStatusValue = "aktif" | "error" | "belum_dikonfigurasi";

export interface IntegrationStatus {
  name: string;
  detail: string;
  status: IntegrationStatusValue;
}

const SUPABASE_FREE_DB_LIMIT_BYTES = 500 * 1024 * 1024;
const SUPABASE_FREE_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const R2_FREE_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
const RESEND_FREE_MONTHLY_LIMIT = 3000;

export { SUPABASE_FREE_DB_LIMIT_BYTES, SUPABASE_FREE_STORAGE_LIMIT_BYTES, R2_FREE_STORAGE_LIMIT_BYTES, RESEND_FREE_MONTHLY_LIMIT };

async function getResendUsage(): Promise<PlatformReport["resend"]> {
  // Key terpisah dari RESEND_API_KEY (yang dipakai kirim email) -- key
  // kirim cuma permission "Sending access", tidak bisa panggil GET
  // /emails (baca riwayat kirim). Butuh key "Full access" tersendiri,
  // khusus buat baca-baca laporan ini.
  const apiKey = process.env.RESEND_REPORTING_API_KEY;
  if (!apiKey) return { sentRecentApprox: 0, approxCapped: false, error: "RESEND_REPORTING_API_KEY belum dikonfigurasi." };

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
    return {
      configured: false,
      lastDeploymentState: null,
      lastDeploymentAt: null,
      lastDeploymentRegion: null,
      lastDeploymentInspectorUrl: null,
      error: null,
    };
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
      lastDeploymentInspectorUrl: null,
      error: `Vercel API error (${res.status})`,
    };
  }

  const body = await res.json();
  const deployment = body.deployments?.[0];

  if (!deployment) {
    return {
      configured: true,
      lastDeploymentState: null,
      lastDeploymentAt: null,
      lastDeploymentRegion: null,
      lastDeploymentInspectorUrl: null,
      error: null,
    };
  }

  return {
    configured: true,
    lastDeploymentState: deployment.state ?? deployment.readyState ?? null,
    lastDeploymentAt: deployment.created ? new Date(deployment.created).toISOString() : null,
    lastDeploymentRegion: deployment.regions?.[0] ?? deployment.target ?? null,
    lastDeploymentInspectorUrl: deployment.inspectorUrl ?? null,
    error: null,
  };
}

/**
 * Status tiap integrasi API pihak ketiga yang dipakai platform ini --
 * dicek dari keberadaan env var (belum tentu = koneksinya sehat, cuma
 * "sudah diisi atau belum"), kecuali Vercel yang sudah dites live di atas
 * jadi statusnya diambil dari hasil tes itu. R2 & Google Contacts belum
 * ada env var-nya sama sekali (masih tahap setup manual Yohan), jadi
 * otomatis tampil "Belum Dikonfigurasi" -- bukan bug, itu memang status
 * sebenarnya per hari laporan ini dibuat.
 *
 * Resend sengaja TIDAK diambil dari `resend.error` -- itu error dari key
 * baca-riwayat terpisah (RESEND_REPORTING_API_KEY), bukan dari kirim email
 * yang sebenarnya (RESEND_API_KEY). Kalau laporan ini sampai terkirim,
 * pengiriman jelas jalan, jadi statusnya "aktif" ditentukan dari keberadaan
 * RESEND_API_KEY itu sendiri, bukan dari fitur baca-riwayat yang terpisah.
 */
function getIntegrationsStatus(vercel: PlatformReport["vercel"]): IntegrationStatus[] {
  return [
    { name: "Supabase", detail: "Database, Auth, Storage", status: "aktif" },
    {
      name: "Resend",
      detail: "Email transactional",
      status: process.env.RESEND_API_KEY ? "aktif" : "belum_dikonfigurasi",
    },
    {
      name: "Vercel API",
      detail: "Status deployment untuk Platform Report",
      status: !vercel.configured ? "belum_dikonfigurasi" : vercel.error ? "error" : "aktif",
    },
    {
      name: "Kapso (WhatsApp)",
      detail: "Kirim/terima pesan WA -- sandbox, nomor produksi belum tersambung",
      status: process.env.KAPSO_API_KEY ? "aktif" : "belum_dikonfigurasi",
    },
    {
      name: "Cloudflare R2",
      detail: "Storage foto listing (pengganti Supabase Storage)",
      status: process.env.R2_ACCESS_KEY_ID ? "aktif" : "belum_dikonfigurasi",
    },
    {
      name: "Google Contacts",
      detail: "Auto-create kontak saat lead baru masuk",
      status: process.env.GOOGLE_CONTACTS_REFRESH_TOKEN ? "aktif" : "belum_dikonfigurasi",
    },
    { name: "GitHub Actions (cron)", detail: "Pemicu Daily Report & Supabase keep-alive", status: "aktif" },
  ];
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
    integrations: getIntegrationsStatus(vercelStatus),
  };
}
