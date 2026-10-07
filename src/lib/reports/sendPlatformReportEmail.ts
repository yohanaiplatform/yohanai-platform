// src/lib/reports/sendPlatformReportEmail.ts

import type { PlatformReport, IntegrationStatus } from "@/lib/reports/getPlatformReport";
import {
  SUPABASE_FREE_DB_LIMIT_BYTES,
  SUPABASE_FREE_STORAGE_LIMIT_BYTES,
  RESEND_FREE_MONTHLY_LIMIT,
} from "@/lib/reports/getPlatformReport";
import { AI_AGENT_DOCS_URL, renderAiAgentKpiListHtml } from "@/lib/reports/aiAgentRoadmap";

const APP_URL = "https://yohanai.id";
const SUPABASE_PROJECT_URL = "https://supabase.com/dashboard/project/yxroxrxzyzewydefnmlv";
const CLOUDFLARE_ZONE_URL = "https://dash.cloudflare.com/bcc0c3478ca6486891bfa0be64b3325b/yohanai.id";

// Link ke dashboard eksternal masing-masing layanan -- laporan ini buat
// developer, jadi wajar link-nya keluar ke dashboard admin tiap servis
// (beda dari Daily Report bisnis yang link-nya ke halaman app).
const LINKS = {
  users: `${SUPABASE_PROJECT_URL}/auth/users`,
  leads: `${APP_URL}/crm`,
  listings: `${APP_URL}/properties`,
  supabaseDb: `${SUPABASE_PROJECT_URL}/database/tables`,
  supabaseStorage: `${SUPABASE_PROJECT_URL}/storage/buckets`,
  resend: "https://resend.com/emails",
  resendBilling: "https://resend.com/settings/billing",
  vercelBilling: "https://vercel.com/account/billing",
  vercelProject: "https://vercel.com/yohan-ai/yohanai-platform",
  r2: `${CLOUDFLARE_ZONE_URL.split("/").slice(0, 4).join("/")}/r2/overview`,
  kapso: "https://kapso.com/platform",
  mintlify: "https://dashboard.mintlify.com",
  cloudflareDns: `${CLOUDFLARE_ZONE_URL}/dns/records`,
};

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDateID(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function kpiTile(label: string, value: string, href: string): string {
  return `
    <td width="33%" style="padding:0 6px;">
      <a href="${href}" style="display:block;background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;padding:14px 12px;text-decoration:none;">
        <div style="font-size:11px;color:#6B7280;">${label}</div>
        <div style="font-size:22px;font-weight:700;color:#111827;font-variant-numeric:tabular-nums;margin-top:2px;">${value}</div>
      </a>
    </td>`;
}

/** Progress bar pemakaian vs limit Free Tier -- warna berubah kalau sudah mendekati limit. Seluruh baris jadi link ke dashboard servis. formatValue default ke fmtBytes (Supabase DB/Storage); dioverride ke fmt (angka biasa) buat kasus non-byte seperti jumlah email. */
function usageBar(
  label: string,
  used: number,
  limit: number,
  href: string,
  formatValue: (n: number) => string = fmtBytes
): string {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
  return `
    <a href="${href}" style="text-decoration:none;color:inherit;display:block;margin-bottom:10px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#374151;">${label}</td>
          <td align="right" style="font-size:12px;color:#6B7280;">${formatValue(used)} / ${formatValue(limit)} (${pct.toFixed(1)}%)</td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;border-radius:5px;margin-top:4px;">
        <tr>
          <td width="${pct.toFixed(1)}%" style="background:${color};height:10px;border-radius:5px;font-size:0;line-height:10px;">&nbsp;</td>
          <td style="font-size:0;line-height:10px;">&nbsp;</td>
        </tr>
      </table>
    </a>`;
}

function sectionCard(title: string, href: string | null, innerHtml: string): string {
  const titleHtml = href
    ? `<a href="${href}" style="color:#374151;text-decoration:none;">${title} &rarr;</a>`
    : title;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;margin-bottom:14px;">
    <tr><td style="padding:16px;">
      <div style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:12px;">${titleHtml}</div>
      ${innerHtml}
    </td></tr>
  </table>`;
}

function statusBadge(ok: boolean, label: string): string {
  const bg = ok ? "#D1FAE5" : "#FEE2E2";
  const ink = ok ? "#065F46" : "#991B1B";
  return `<span style="display:inline-block;background:${bg};color:${ink};font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;">${label}</span>`;
}

const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus["status"], { label: string; ok: boolean }> = {
  aktif: { label: "Aktif", ok: true },
  error: { label: "Error", ok: false },
  belum_dikonfigurasi: { label: "Belum Dikonfigurasi", ok: false },
};

function renderIntegrationsListHtml(integrations: IntegrationStatus[]): string {
  const aktifCount = integrations.filter((i) => i.status === "aktif").length;
  const rows = integrations
    .map((i) => {
      const { label, ok } = INTEGRATION_STATUS_LABEL[i.status];
      return `<tr>
        <td style="padding:6px 0;font-size:12px;color:#111827;font-weight:600;border-bottom:1px solid #F3F4F6;">${i.name}</td>
        <td style="padding:6px 0;font-size:11px;color:#9CA3AF;border-bottom:1px solid #F3F4F6;">${i.detail}</td>
        <td align="right" style="padding:6px 0;border-bottom:1px solid #F3F4F6;">${statusBadge(ok, label)}</td>
      </tr>`;
    })
    .join("");

  return `
    <p style="font-size:12px;color:#374151;margin:0 0 10px;"><strong>${aktifCount} dari ${integrations.length}</strong> integrasi API aktif.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function costRow(service: string, href: string | null, tier: string, limit: string, upgrade: string): string {
  const serviceHtml = href
    ? `<a href="${href}" style="color:#111827;text-decoration:none;font-weight:600;">${service}</a>`
    : `<span style="font-weight:600;">${service}</span>`;
  return `<tr>
    <td style="padding:6px 8px;font-size:12px;color:#111827;border-bottom:1px solid #F3F4F6;">${serviceHtml}</td>
    <td style="padding:6px 8px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${tier}</td>
    <td style="padding:6px 8px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${limit}</td>
    <td style="padding:6px 8px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${upgrade}</td>
  </tr>`;
}

function renderBillingHtml(b: PlatformReport["anthropicBilling"], estimateMonthUsd: number): string {
  if (!b.available) {
    const needsOrg = !b.error || b.error.includes("belum dikonfigurasi") || /Anthropic Admin API (401|403)/.test(b.error);
    return `<div style="margin-top:12px;padding:10px;background:#F3F4F6;border-radius:6px;font-size:12px;color:#374151;">${
      needsOrg
        ? 'Tagihan asli belum tersedia: butuh akun organisasi Claude Console (Admin API). Untuk angka resmi, lihat halaman <strong>Billing</strong> dan <strong>Usage</strong> di Claude Console, dan cek saldo kredit di sana.'
        : `Tagihan asli Anthropic belum bisa dibaca: ${b.error}`
    }</div>`;
  }
  const diff = b.monthUsd - estimateMonthUsd;
  const lines = b.monthLines
    .map((l) => `<tr><td style="padding:3px 0;font-size:12px;color:#374151;">${l.description}</td><td style="padding:3px 0;font-size:12px;color:#111827;text-align:right;">${formatUsd(l.usd)}</td></tr>`)
    .join("");
  return `<div style="margin-top:12px;padding:10px;background:#ECFDF5;border-radius:6px;">
      <div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px;">Tagihan ASLI Anthropic (Claude Console, seluruh organisasi)</div>
      <div style="font-size:12px;color:#064E3B;">
        Hari ${b.lastDayLabel ?? "-"} (UTC): <strong>${formatUsd(b.lastDayUsd)}</strong>
        &nbsp;&middot;&nbsp; 7 hari: <strong>${formatUsd(b.weekUsd)}</strong>
        &nbsp;&middot;&nbsp; Bulan ini: <strong>${formatUsd(b.monthUsd)}</strong>
      </div>
      <div style="font-size:11px;color:#065F46;margin-top:4px;">Selisih dengan estimasi aplikasi bulan ini: ${diff >= 0 ? "+" : "-"}${formatUsd(Math.abs(diff))} (tagihan asli mencakup semua pemakaian di akun Console dan dipotong per hari UTC).</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">${lines}</table>
    </div>`;
}

function renderAiUsageHtml(u: PlatformReport["aiUsage"], billing: PlatformReport["anthropicBilling"]): string {
  const th = "padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;text-align:right;";
  const td = "padding:6px 8px;font-size:12px;color:#111827;text-align:right;border-bottom:1px solid #F3F4F6;";
  const row = (p: PlatformReport["aiUsage"]["daily"]) =>
    `<tr>
      <td style="${td}text-align:left;font-weight:600;">${p.label}</td>
      <td style="${td}">${fmt(p.messages)}</td>
      <td style="${td}">${fmt(p.inputTokens)} / ${fmt(p.outputTokens)}</td>
      <td style="${td}font-weight:700;">${formatUsd(p.costUsd)}</td>
      <td style="${td}">${fmt(p.nurtureSent)}</td>
    </tr>`;
  const top = u.topLeads.length
    ? `<div style="margin-top:10px;font-size:12px;color:#374151;"><strong>Lead dengan biaya AI terbesar bulan ini:</strong><br/>${u.topLeads
        .map((l) => `${l.name} -- ${fmt(l.messages)} pesan, ${formatUsd(l.costUsd)}`)
        .join("<br/>")}</div>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr style="background:#F9FAFB;">
        <td style="${th}text-align:left;">Periode</td>
        <td style="${th}">Pesan AI</td>
        <td style="${th}">Token in / out</td>
        <td style="${th}">Biaya AI</td>
        <td style="${th}">Template WA nurturing</td>
      </tr>
      ${row(u.daily)}${row(u.weekly)}${row(u.monthly)}
    </table>
    <div style="margin-top:10px;font-size:12px;color:#374151;">
      Proyeksi biaya AI bulan ini: <strong>${formatUsd(u.monthlyProjectionUsd)}</strong>
      &nbsp;&middot;&nbsp; Rata-rata per pesan: <strong>${formatUsd(u.avgCostPerMessageUsd)}</strong>
    </div>
    ${top}
    ${renderBillingHtml(billing, u.monthly.costUsd)}
    <p style="font-size:11px;color:#9CA3AF;margin:8px 0 0;">Estimasi dari token yang tercatat di aplikasi (harga Sonnet 5.5, $2/$10 per 1M token), termasuk Celah Pengetahuan harian. Bukan angka invoice -- biaya template WhatsApp berbayar dihitung Kapso/Meta, di sini hanya jumlah yang terkirim. Cek Anthropic Console untuk tagihan asli.</p>`;
}

function formatUsd(n: number): string {
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
}

function renderHtml(report: PlatformReport): string {
  const { users, leads, listings, supabase, resend, vercel, aiAgent } = report;

  const vercelStatusHtml = !vercel.configured
    ? `<p style="font-size:12px;color:#9CA3AF;">Belum dikonfigurasi -- isi VERCEL_API_TOKEN &amp; VERCEL_PROJECT_ID untuk lihat status deployment terakhir di sini.</p>`
    : vercel.error
      ? `<p style="font-size:12px;color:#991B1B;">${vercel.error}</p>`
      : `<a href="${vercel.lastDeploymentInspectorUrl ?? LINKS.vercelProject}" style="text-decoration:none;color:inherit;display:block;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:12px;color:#374151;">Deployment production terakhir</td>
            <td align="right">${statusBadge(vercel.lastDeploymentState === "READY", vercel.lastDeploymentState ?? "-")}</td>
          </tr></table>
          <p style="font-size:11px;color:#9CA3AF;margin-top:6px;">
            ${vercel.lastDeploymentAt ? formatDateID(vercel.lastDeploymentAt) : "-"} &middot; region ${vercel.lastDeploymentRegion ?? "-"}
          </p>
        </a>`;

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yohan.AI Platform Report</title>
<style>
  @media print {
    body, .email-bg { background:#ffffff !important; }
    .email-wrap { padding:0 !important; }
    a { color: inherit !important; }
    @page { size: A4; margin: 14mm; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div class="email-bg" style="background:#F3F4F6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" class="email-wrap" style="padding:20px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;">

            <tr><td style="padding-bottom:4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:19px;font-weight:700;color:#1F2937;">
                    Yohan<span style="color:#7A1F1F;">.AI</span> <span style="font-weight:400;color:#374151;">Platform Report</span>
                  </td>
                  <td align="right" style="font-size:12px;color:#6B7280;white-space:nowrap;">${formatDateID(report.generatedAt)}</td>
                </tr>
              </table>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">Untuk pengembang -- kesehatan infrastruktur &amp; pertumbuhan platform, bukan laporan bisnis.</div>
            </td></tr>

            <tr><td style="padding:14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${kpiTile("Total User", fmt(users.total), LINKS.users)}
                  ${kpiTile("Total Lead", `${fmt(leads.total)} <span style=\"font-size:12px;color:#10B981;font-weight:600;\">+${fmt(leads.newThisWeek)}/mgg</span>`, LINKS.leads)}
                  ${kpiTile("Total Listing", `${fmt(listings.total)} <span style=\"font-size:12px;color:#10B981;font-weight:600;\">+${fmt(listings.newThisWeek)}/mgg</span>`, LINKS.listings)}
                </tr>
              </table>
            </td></tr>

            <tr><td>
              ${sectionCard(
                "Supabase",
                SUPABASE_PROJECT_URL,
                `${usageBar("Database", supabase.dbSizeBytes, SUPABASE_FREE_DB_LIMIT_BYTES, LINKS.supabaseDb)}
                 ${usageBar("Storage", supabase.storageSizeBytes, SUPABASE_FREE_STORAGE_LIMIT_BYTES, LINKS.supabaseStorage)}
                 <p style="font-size:11px;color:#9CA3AF;margin:8px 0 0;">${fmt(supabase.storageObjectCount)} file di storage. Free Tier auto-pause setelah 7 hari tanpa query -- sudah dimitigasi GitHub Actions keep-alive.</p>`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard(
                "Resend (Email)",
                LINKS.resend,
                resend.error
                  ? `<p style="font-size:12px;color:#991B1B;">${resend.error} -- <a href="${LINKS.resendBilling}" style="color:#991B1B;">cek billing Resend</a></p>`
                  : `${usageBar("Email terkirim bulan ini (perkiraan)", resend.sentRecentApprox, RESEND_FREE_MONTHLY_LIMIT, LINKS.resend, fmt)}
                     ${resend.approxCapped ? `<p style="font-size:11px;color:#9CA3AF;">Perkiraan dari 100 email terakhir -- Resend tidak punya endpoint total kirim, angka sebenarnya bisa lebih tinggi.</p>` : ""}`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard("Vercel", LINKS.vercelProject, vercelStatusHtml)}
            </td></tr>

            <tr><td>
              ${sectionCard("Status Integrasi API", null, renderIntegrationsListHtml(report.integrations))}
            </td></tr>

            ${
              report.googleContactsAccessRequests.count > 0
                ? `<tr><td>
                    ${sectionCard(
                      "Permintaan Akses Google Contacts Tertunda",
                      `${APP_URL}/settings`,
                      `<p style="font-size:12px;color:#991B1B;margin:0 0 8px;"><strong>${report.googleContactsAccessRequests.count} user</strong> menunggu ditambahkan sebagai test user di Google Cloud Console (OAuth consent screen masih mode Testing).</p>
                       <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                         ${report.googleContactsAccessRequests.emails
                           .map(
                             (email) =>
                               `<tr><td style="padding:4px 0;font-size:12px;color:#111827;border-bottom:1px solid #F3F4F6;">${email}</td></tr>`
                           )
                           .join("")}
                       </table>
                       <p style="font-size:11px;color:#9CA3AF;margin-top:8px;">Tambahkan email di atas ke OAuth consent screen &rarr; Audience &rarr; Test users di Google Cloud Console, lalu klik "Setujui" di notifikasi in-app (bell icon) supaya user tahu bisa coba connect lagi.</p>`
                    )}
                  </td></tr>`
                : ""
            }

            <tr><td>
              ${sectionCard(
                "AI Agent Kemarin (Agregat Semua User)",
                null,
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${kpiTile("Pesan Diproses", fmt(aiAgent.runsToday), `${APP_URL}/dashboard`)}
                    ${kpiTile("Balasan Terkirim", fmt(aiAgent.repliesSentToday), `${APP_URL}/dashboard`)}
                    ${kpiTile("Foto Dikirim", fmt(aiAgent.photosSentToday), `${APP_URL}/dashboard`)}
                  </tr>
                </table>
                 <div style="margin-top:10px;padding-top:10px;border-top:1px solid #F3F4F6;font-size:12px;color:#374151;">
                   Token: <strong>${fmt(aiAgent.inputTokensToday)}</strong> in / <strong>${fmt(aiAgent.outputTokensToday)}</strong> out
                   &nbsp;&middot;&nbsp;
                   Butuh follow-up: <strong>${fmt(aiAgent.needsFollowUpToday)}</strong>
                   &nbsp;&middot;&nbsp;
                   Estimasi biaya: <strong>${formatUsd(aiAgent.estimatedCostUsd)}</strong>
                 </div>
                 <p style="font-size:11px;color:#9CA3AF;margin:6px 0 0;">Estimasi berbasis harga Sonnet 5.5 ($2/$10 per 1M token) dari ai.agent_runs.llm_raw_response.usage -- bukan angka invoice asli, cek Anthropic Console untuk itu.</p>`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard(
                "Pemakaian &amp; Biaya AI (Estimasi)",
                "https://console.anthropic.com/settings/usage",
                renderAiUsageHtml(report.aiUsage, report.anthropicBilling)
              )}
            </td></tr>

            <tr><td>
              ${sectionCard("Fitur Lanjutan AI Agent (Rencana)", AI_AGENT_DOCS_URL, renderAiAgentKpiListHtml())}
            </td></tr>

            <tr><td>
              ${sectionCard(
                "Referensi Tier &amp; Biaya Semua Layanan",
                null,
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr style="background:#F9FAFB;">
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Layanan</td>
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Tier Sekarang</td>
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Limit Gratis</td>
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Kalau Upgrade</td>
                  </tr>
                  ${costRow("Vercel", LINKS.vercelBilling, "Hobby -- Rp0", "100GB bandwidth/bln", "Pro ~$20/bulan/user")}
                  ${costRow("Supabase", `${SUPABASE_PROJECT_URL}/settings/billing`, "Free -- Rp0", "500MB DB, 1GB Storage", "Pro ~$25/bulan")}
                  ${costRow("Cloudflare R2", LINKS.r2, "Rp0 (baru mulai dipakai)", "10GB storage/bln gratis", "~$0.015/GB/bulan setelahnya")}
                  ${costRow("Resend", LINKS.resendBilling, "Free -- Rp0", "100/hari, 3.000/bulan", "~$20/bulan untuk 50rb email")}
                  ${costRow("Kapso (WhatsApp)", LINKS.kapso, "Cek dashboard Kapso", "Tergantung tier", "Cek kapso.com/platform")}
                  ${costRow("Domain yohanai.id", null, "Aktif", "-", "Cek invoice registrar tiap tahun")}
                  ${costRow("Mintlify (docs)", LINKS.mintlify, "Cek dashboard Mintlify", "-", "Cek mintlify.com/pricing")}
                  ${costRow("Cloudflare DNS", LINKS.cloudflareDns, "Free -- Rp0", "-", "-")}
                </table>
                <p style="font-size:11px;color:#9CA3AF;margin-top:10px;">
                  <strong>Catatan penting:</strong> Vercel Hobby plan menurut Terms of Service resminya untuk pemakaian non-komersial. Platform ini dipakai untuk bisnis aktif (Griya Indonesia) -- pertimbangkan upgrade ke Pro kalau volume trafik mulai signifikan, bukan cuma soal limit teknis.
                </p>
                <p style="font-size:11px;color:#9CA3AF;margin-top:6px;">
                  Angka di atas tarif publik per hari laporan ini dibuat, bukan tagihan real-time (sebagian besar layanan masih di tier gratis, belum ada invoice untuk ditarik). Proyeksi "berapa lama lagi sampai limit habis" belum bisa dihitung -- butuh data snapshot historis yang belum dikumpulkan, direncanakan menyusul.
                </p>`
              )}
            </td></tr>

            <tr><td style="border-top:1px solid #E5E7EB;padding-top:14px;text-align:center;">
              <div style="font-size:12px;font-weight:600;color:#374151;">Yohan.AI Platform</div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">Laporan developer, dikirim tiap hari jam 07:00 WIB</div>
            </td></tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export async function sendPlatformReportEmail(report: PlatformReport): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.PLATFORM_REPORT_RECIPIENT || "admin@yohanai.id";

  if (!apiKey || !from) {
    return { error: "RESEND_API_KEY/RESEND_FROM_EMAIL belum dikonfigurasi." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Yohan.AI Platform Report -- ${formatDateID(report.generatedAt)}`,
      html: renderHtml(report),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Resend API error: ${body}` };
  }

  return { error: null };
}
