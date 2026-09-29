// src/lib/reports/sendPlatformReportEmail.ts

import type { PlatformReport } from "@/lib/reports/getPlatformReport";
import {
  SUPABASE_FREE_DB_LIMIT_BYTES,
  SUPABASE_FREE_STORAGE_LIMIT_BYTES,
  RESEND_FREE_MONTHLY_LIMIT,
} from "@/lib/reports/getPlatformReport";

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

function kpiTile(label: string, value: string): string {
  return `
    <td width="33%" style="padding:0 6px;">
      <div style="background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;padding:14px 12px;">
        <div style="font-size:11px;color:#6B7280;">${label}</div>
        <div style="font-size:22px;font-weight:700;color:#111827;font-variant-numeric:tabular-nums;margin-top:2px;">${value}</div>
      </div>
    </td>`;
}

/** Progress bar pemakaian vs limit Free Tier -- warna berubah kalau sudah mendekati limit. */
function usageBar(label: string, used: number, limit: number): string {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
  return `
    <div style="margin-bottom:10px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#374151;">${label}</td>
          <td align="right" style="font-size:12px;color:#6B7280;">${fmtBytes(used)} / ${fmtBytes(limit)} (${pct.toFixed(1)}%)</td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;border-radius:5px;margin-top:4px;">
        <tr>
          <td width="${pct.toFixed(1)}%" style="background:${color};height:10px;border-radius:5px;font-size:0;line-height:10px;">&nbsp;</td>
          <td style="font-size:0;line-height:10px;">&nbsp;</td>
        </tr>
      </table>
    </div>`;
}

function sectionCard(title: string, innerHtml: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;margin-bottom:14px;">
    <tr><td style="padding:16px;">
      <div style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:12px;">${title}</div>
      ${innerHtml}
    </td></tr>
  </table>`;
}

function statusBadge(ok: boolean, label: string): string {
  const bg = ok ? "#D1FAE5" : "#FEE2E2";
  const ink = ok ? "#065F46" : "#991B1B";
  return `<span style="display:inline-block;background:${bg};color:${ink};font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;">${label}</span>`;
}

function costRow(service: string, tier: string, limit: string, upgrade: string): string {
  return `<tr>
    <td style="padding:6px 8px;font-size:12px;color:#111827;border-bottom:1px solid #F3F4F6;">${service}</td>
    <td style="padding:6px 8px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${tier}</td>
    <td style="padding:6px 8px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${limit}</td>
    <td style="padding:6px 8px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${upgrade}</td>
  </tr>`;
}

function renderHtml(report: PlatformReport): string {
  const { users, leads, listings, supabase, resend, vercel } = report;

  const vercelStatusHtml = !vercel.configured
    ? `<p style="font-size:12px;color:#9CA3AF;">Belum dikonfigurasi -- isi VERCEL_API_TOKEN &amp; VERCEL_PROJECT_ID untuk lihat status deployment terakhir di sini.</p>`
    : vercel.error
      ? `<p style="font-size:12px;color:#991B1B;">${vercel.error}</p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:12px;color:#374151;">Deployment production terakhir</td>
          <td align="right">${statusBadge(vercel.lastDeploymentState === "READY", vercel.lastDeploymentState ?? "-")}</td>
        </tr></table>
        <p style="font-size:11px;color:#9CA3AF;margin-top:6px;">
          ${vercel.lastDeploymentAt ? formatDateID(vercel.lastDeploymentAt) : "-"} &middot; region ${vercel.lastDeploymentRegion ?? "-"}
        </p>`;

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
                  ${kpiTile("Total User", fmt(users.total))}
                  ${kpiTile("Total Lead", `${fmt(leads.total)} <span style=\"font-size:12px;color:#10B981;font-weight:600;\">+${fmt(leads.newThisWeek)}/mgg</span>`)}
                  ${kpiTile("Total Listing", `${fmt(listings.total)} <span style=\"font-size:12px;color:#10B981;font-weight:600;\">+${fmt(listings.newThisWeek)}/mgg</span>`)}
                </tr>
              </table>
            </td></tr>

            <tr><td>
              ${sectionCard(
                "Supabase",
                `${usageBar("Database", supabase.dbSizeBytes, SUPABASE_FREE_DB_LIMIT_BYTES)}
                 ${usageBar("Storage", supabase.storageSizeBytes, SUPABASE_FREE_STORAGE_LIMIT_BYTES)}
                 <p style="font-size:11px;color:#9CA3AF;margin:8px 0 0;">${fmt(supabase.storageObjectCount)} file di storage. Free Tier auto-pause setelah 7 hari tanpa query -- sudah dimitigasi GitHub Actions keep-alive.</p>`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard(
                "Resend (Email)",
                resend.error
                  ? `<p style="font-size:12px;color:#991B1B;">${resend.error}</p>`
                  : `${usageBar("Email terkirim bulan ini (perkiraan)", resend.sentRecentApprox, RESEND_FREE_MONTHLY_LIMIT)}
                     ${resend.approxCapped ? `<p style="font-size:11px;color:#9CA3AF;">Perkiraan dari 100 email terakhir -- Resend tidak punya endpoint total kirim, angka sebenarnya bisa lebih tinggi.</p>` : ""}`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard("Vercel", vercelStatusHtml)}
            </td></tr>

            <tr><td>
              ${sectionCard(
                "Referensi Tier &amp; Biaya Semua Layanan",
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr style="background:#F9FAFB;">
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Layanan</td>
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Tier Sekarang</td>
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Limit Gratis</td>
                    <td style="padding:6px 8px;font-size:11px;font-weight:700;color:#6B7280;">Kalau Upgrade</td>
                  </tr>
                  ${costRow("Vercel", "Hobby -- Rp0", "100GB bandwidth/bln", "Pro ~$20/bulan/user")}
                  ${costRow("Supabase", "Free -- Rp0", "500MB DB, 1GB Storage", "Pro ~$25/bulan")}
                  ${costRow("Cloudflare R2", "Rp0 (baru mulai dipakai)", "10GB storage/bln gratis", "~$0.015/GB/bulan setelahnya")}
                  ${costRow("Resend", "Free -- Rp0", "100/hari, 3.000/bulan", "~$20/bulan untuk 50rb email")}
                  ${costRow("Kapso (WhatsApp)", "Cek dashboard Kapso", "Tergantung tier", "Cek kapso.com/platform")}
                  ${costRow("Domain yohanai.id", "Aktif", "-", "Cek invoice registrar tiap tahun")}
                  ${costRow("Mintlify (docs)", "Cek dashboard Mintlify", "-", "Cek mintlify.com/pricing")}
                  ${costRow("Cloudflare DNS", "Free -- Rp0", "-", "-")}
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
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">Laporan developer, dikirim tiap hari jam 07:00 WIB ke admin@yohanai.id</div>
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
