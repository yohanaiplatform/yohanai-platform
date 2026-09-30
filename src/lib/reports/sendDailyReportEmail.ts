// src/lib/reports/sendDailyReportEmail.ts

import type { DailyReport } from "@/lib/reports/getDailyReport";
import { AI_AGENT_DOCS_URL, renderAiAgentKpiListHtml } from "@/lib/reports/aiAgentRoadmap";

const APP_URL = "https://yohanai.id";

// Warna disamakan persis dengan yang dipakai di dashboard/app --
// LeadFunnel.tsx (temperature) dan property-status-badge.tsx (status listing).
const TEMPERATURE_COLOR: Record<string, string> = {
  hot: "#EF4444",
  warm: "#F59E0B",
  cold: "#3B82F6",
  closing: "#10B981",
  batal: "#737373",
};

const LISTING_STATUS_COLOR: Record<string, string> = {
  available: "#10B981",
  booked: "#F59E0B",
  sold: "#3B82F6",
  hold: "#94A3B8",
};

function formatDateID(dateWIB: string): string {
  // dateWIB sudah tanggal kalender WIB (YYYY-MM-DD) -- parse sebagai UTC
  // supaya tidak ikut digeser lagi oleh timezone locale saat diformat.
  return new Date(`${dateWIB}T00:00:00Z`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

/** Tile KPI besar di baris atas -- seluruh tile adalah link ke halaman terkait. */
function kpiTile(label: string, value: number, href: string, accent = "#111827"): string {
  return `
    <td width="25%" style="padding:0 6px;">
      <a href="${href}" style="display:block;background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;padding:14px 12px;text-decoration:none;">
        <div style="font-size:11px;color:#6B7280;line-height:1.3;">${label}</div>
        <div style="font-size:22px;font-weight:700;color:${accent};font-variant-numeric:tabular-nums;line-height:1.3;margin-top:2px;">${fmt(value)}</div>
      </a>
    </td>`;
}

/** Satu baris horizontal bar chart, proporsional ke nilai terbesar di grup. Seluruh baris jadi link. */
function barRow(label: string, value: number, maxValue: number, color: string, href: string): string {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 3 : 0) : 0;
  return `
  <a href="${href}" style="text-decoration:none;color:inherit;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td width="72" style="font-size:12px;color:#374151;padding-right:8px;">${label}</td>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;border-radius:5px;">
            <tr>
              <td width="${pct.toFixed(1)}%" style="background:${color};height:14px;border-radius:5px;line-height:14px;font-size:0;">&nbsp;</td>
              <td style="line-height:14px;font-size:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
        <td width="44" align="right" style="font-size:12px;font-weight:700;color:#111827;padding-left:8px;font-variant-numeric:tabular-nums;">${fmt(value)}</td>
      </tr>
    </table>
  </a>`;
}

/** Kartu "perlu perhatian" (Follow-up Backlog / Lead Beku) -- seluruh kartu link. */
function alertCard(icon: string, label: string, value: number, note: string, href: string, bg: string, border: string, ink: string): string {
  return `
    <td width="50%" style="padding:0 6px;">
      <a href="${href}" style="display:block;background:${bg};border:1px solid ${border};border-radius:10px;padding:14px;text-decoration:none;">
        <div style="font-size:12px;font-weight:600;color:${ink};">${icon} ${label}</div>
        <div style="font-size:24px;font-weight:700;color:${ink};font-variant-numeric:tabular-nums;margin-top:2px;">${fmt(value)}</div>
        <div style="font-size:11px;color:${ink};margin-top:2px;opacity:0.85;">${note}</div>
      </a>
    </td>`;
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

function formatUsd(n: number): string {
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
}

function renderHtml(report: DailyReport, recipientName: string | null): string {
  const { leads, listings, chat, aiAgent, reportDateWIB, isAggregate } = report;

  const maxTemp = Math.max(leads.hot, leads.warm, leads.cold, leads.closing, leads.batal, 1);
  const listingTotal = listings.available + listings.booked + listings.sold + listings.hold || 1;

  const crm = (query: string) => `${APP_URL}/crm${query ? `?${query}` : ""}`;
  const properties = (query: string) => `${APP_URL}/properties${query ? `?${query}` : ""}`;
  const dashboard = `${APP_URL}/dashboard`;

  const temperatureBars = [
    barRow("Hot", leads.hot, maxTemp, TEMPERATURE_COLOR.hot, crm("temperature=hot")),
    barRow("Warm", leads.warm, maxTemp, TEMPERATURE_COLOR.warm, crm("temperature=warm")),
    barRow("Cold", leads.cold, maxTemp, TEMPERATURE_COLOR.cold, crm("temperature=cold")),
    barRow("Closing", leads.closing, maxTemp, TEMPERATURE_COLOR.closing, crm("temperature=closing")),
    barRow("Batal", leads.batal, maxTemp, TEMPERATURE_COLOR.batal, crm("temperature=batal")),
  ].join("");

  const listingSegments = (
    [
      ["available", listings.available],
      ["booked", listings.booked],
      ["sold", listings.sold],
      ["hold", listings.hold],
    ] as const
  )
    .map(([key, value]) => {
      const pct = (value / listingTotal) * 100;
      if (pct <= 0) return "";
      return `<td width="${pct.toFixed(1)}%" style="background:${LISTING_STATUS_COLOR[key]};height:14px;font-size:0;line-height:14px;">&nbsp;</td>`;
    })
    .join("");

  const listingLegend = (
    [
      ["available", "Available", listings.available, properties("status=available")],
      ["booked", "Booked", listings.booked, properties("status=booked")],
      ["sold", "Sold", listings.sold, properties("status=sold")],
      ["hold", "Hold", listings.hold, properties("status=hold")],
    ] as const
  )
    .map(
      ([key, label, value, href]) => `
      <td style="padding-top:8px;">
        <a href="${href}" style="text-decoration:none;color:#374151;font-size:12px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${LISTING_STATUS_COLOR[key]};margin-right:4px;"></span>${label} <strong style="font-variant-numeric:tabular-nums;">${fmt(value)}</strong>
        </a>
      </td>`
    )
    .join("");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yohan.AI Daily Report</title>
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

            <tr><td style="padding-bottom:14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:19px;font-weight:700;color:#7A1F1F;">
                    Yohan<span style="color:#111827;">.AI</span> <span style="font-weight:400;color:#374151;">Daily Report</span>
                  </td>
                  <td align="right" style="font-size:12px;color:#6B7280;white-space:nowrap;">${formatDateID(reportDateWIB)}</td>
                </tr>
              </table>
              ${
                isAggregate
                  ? ""
                  : `<div style="font-size:11px;color:#9CA3AF;margin-top:4px;">Laporan personal${recipientName ? ` untuk ${recipientName}` : ""} -- dibatasi ke lead &amp; listing yang ditugaskan ke Anda.</div>`
              }
            </td></tr>

            <tr><td style="padding-bottom:14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${kpiTile("Total Lead", leads.total, crm(""), "#7A1F1F")}
                  ${kpiTile("Lead Baru Hari Ini", leads.newToday, crm(`dateFrom=${reportDateWIB}&dateTo=${reportDateWIB}`))}
                  ${kpiTile("Listing Aktif", listings.total, properties(""))}
                  ${kpiTile("Percakapan WA", chat.conversationsTotal, dashboard)}
                </tr>
              </table>
            </td></tr>

            <tr><td>
              ${sectionCard("Distribusi Lead per Temperature", temperatureBars)}
            </td></tr>

            <tr><td style="padding-bottom:14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${alertCard("&#9888;", "Follow-up Backlog", leads.followUpBacklog, "Hot/Warm belum di-follow-up &gt;48 jam", crm("temperature=hot,warm"), "#FEF3C7", "#FDE68A", "#92400E")}
                  ${alertCard("&#10052;", "Lead Beku", leads.frozenLeads, "Cold belum tersentuh &gt;30 hari", crm("temperature=cold"), "#DBEAFE", "#BFDBFE", "#1E3A8A")}
                </tr>
              </table>
            </td></tr>

            <tr><td>
              ${sectionCard(
                `Status Listing &middot; ${fmt(listings.total)} aktif`,
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;margin-bottom:4px;"><tr>${listingSegments || `<td style="background:#E5E7EB;height:14px;font-size:0;">&nbsp;</td>`}</tr></table>
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${listingLegend}</tr></table>
                 <div style="margin-top:10px;padding-top:10px;border-top:1px solid #F3F4F6;font-size:12px;">
                   <a href="${properties("showHidden=true")}" style="color:#374151;text-decoration:none;">Tersembunyi <strong>${fmt(listings.hidden)}</strong></a>
                   &nbsp;&middot;&nbsp;
                   <a href="${properties("")}" style="color:#374151;text-decoration:none;">Listing baru hari ini <strong>${fmt(listings.newToday)}</strong></a>
                 </div>`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard(
                "WhatsApp",
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  ${kpiTile("Percakapan Aktif Hari Ini", chat.activeConversationsToday, dashboard)}
                  ${kpiTile("Pesan Masuk", chat.messagesInToday, dashboard)}
                  ${kpiTile("Pesan Keluar", chat.messagesOutToday, dashboard)}
                  ${kpiTile("Total Pesan Hari Ini", chat.messagesToday, dashboard)}
                </tr></table>`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard(
                "AI Agent Hari Ini",
                `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  ${kpiTile("Pesan Diproses", aiAgent.runsToday, dashboard)}
                  ${kpiTile("Balasan Terkirim", aiAgent.repliesSentToday, dashboard)}
                  ${kpiTile("Foto Dikirim", aiAgent.photosSentToday, dashboard)}
                  ${kpiTile("Butuh Follow-up", aiAgent.needsFollowUpToday, dashboard, aiAgent.needsFollowUpToday > 0 ? "#92400E" : "#111827")}
                </tr></table>
                 <div style="margin-top:10px;padding-top:10px;border-top:1px solid #F3F4F6;font-size:12px;color:#374151;">
                   Token: <strong>${fmt(aiAgent.inputTokensToday)}</strong> in / <strong>${fmt(aiAgent.outputTokensToday)}</strong> out
                   &nbsp;&middot;&nbsp;
                   Estimasi biaya: <strong>${formatUsd(aiAgent.estimatedCostUsd)}</strong>
                 </div>
                 <div style="margin-top:4px;font-size:11px;color:#9CA3AF;">
                   Estimasi berbasis harga Sonnet 5.5 ($2/$10 per 1M token) -- angka biaya sebenarnya, cek Anthropic Console.
                 </div>`
              )}
            </td></tr>

            <tr><td>
              ${sectionCard(
                `<a href="${AI_AGENT_DOCS_URL}" style="color:#374151;text-decoration:none;">Fitur Lanjutan AI Agent (Rencana) &rarr;</a>`,
                renderAiAgentKpiListHtml()
              )}
            </td></tr>

            <tr><td style="padding:4px 4px 14px;font-size:11px;color:#9CA3AF;line-height:1.5;">
              AI crawler, visitor listing/foto, dan download foto/video belum masuk laporan ini &mdash; instrumentasinya belum dibangun.
            </td></tr>

            <tr><td style="border-top:1px solid #E5E7EB;padding-top:14px;text-align:center;">
              <div style="font-size:12px;font-weight:600;color:#374151;">Yohan.AI Platform</div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">Property Buyer Behavior Intelligence &middot; <a href="${APP_URL}" style="color:#9CA3AF;">yohanai.id</a></div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">Laporan otomatis, dikirim tiap hari jam 07:00 WIB</div>
            </td></tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export interface DailyReportRecipientInput {
  email: string;
  displayName: string | null;
}

/**
 * Dipanggil sekali per penerima (lihat getDailyReportRecipients.ts) --
 * `to` sekarang parameter, bukan dibaca dari env var DAILY_REPORT_RECIPIENT
 * (env var itu sudah tidak dipakai lagi sejak Daily Report jadi personal
 * per user, 29 September 2026).
 */
export async function sendDailyReportEmail(
  report: DailyReport,
  recipient: DailyReportRecipientInput
): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

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
      to: [recipient.email],
      subject: `Yohan.AI Daily Report -- ${formatDateID(report.reportDateWIB)}`,
      html: renderHtml(report, recipient.displayName),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Resend API error: ${body}` };
  }

  return { error: null };
}
