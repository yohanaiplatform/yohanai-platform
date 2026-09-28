// src/lib/reports/sendDailyReportEmail.ts

import type { DailyReport } from "@/lib/reports/getDailyReport";

function formatDateID(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function row(label: string, value: string | number): string {
  return `<tr><td style="padding:6px 0;color:#4B5850">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${value}</td></tr>`;
}

function section(title: string, rowsHtml: string): string {
  return `
    <div style="margin-bottom:24px">
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.04em;color:#2F5D50;margin:0 0 8px">${title}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml}</table>
    </div>`;
}

function renderHtml(report: DailyReport): string {
  const { leads, listings, chat } = report;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#EEF1EF;font-family:system-ui,-apple-system,sans-serif;color:#16211C">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #C7D0C9">
      <h1 style="font-size:18px;margin:0 0 4px">Yohan.AI Daily Report</h1>
      <p style="font-size:13px;color:#4B5850;margin:0 0 24px">${formatDateID(report.generatedAt)}</p>

      ${section(
        "Lead",
        row("Total lead", leads.total) +
          row("Lead baru hari ini", leads.newToday) +
          row("Hot", leads.hot) +
          row("Warm", leads.warm) +
          row("Cold", leads.cold) +
          row("Closing", leads.closing) +
          row("Batal", leads.batal) +
          row("Follow-up Backlog (Hot/Warm &gt;48j)", leads.followUpBacklog) +
          row("Lead Beku (Cold &gt;30h)", leads.frozenLeads)
      )}

      ${section(
        "Listing",
        row("Total listing aktif", listings.total) +
          row("Listing baru hari ini", listings.newToday) +
          row("Tersembunyi", listings.hidden) +
          row("Available", listings.available) +
          row("Booked", listings.booked) +
          row("Sold", listings.sold) +
          row("Hold", listings.hold)
      )}

      ${section(
        "WhatsApp",
        row("Total percakapan", chat.conversationsTotal) +
          row("Percakapan aktif hari ini", chat.activeConversationsToday) +
          row("Pesan masuk hari ini", chat.messagesInToday) +
          row("Pesan keluar hari ini", chat.messagesOutToday)
      )}

      <p style="font-size:12px;color:#4B5850;margin-top:24px;padding-top:16px;border-top:1px solid #C7D0C9">
        Penggunaan token AI, AI crawler, visitor listing/foto, dan download foto/video belum masuk laporan ini -- instrumentasinya belum dibangun.
      </p>
    </div>
  </body>
</html>`;
}

export async function sendDailyReportEmail(report: DailyReport): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.DAILY_REPORT_RECIPIENT;

  if (!apiKey || !from || !to) {
    return { error: "RESEND_API_KEY/RESEND_FROM_EMAIL/DAILY_REPORT_RECIPIENT belum dikonfigurasi." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((email) => email.trim()),
      subject: `Yohan.AI Daily Report -- ${formatDateID(report.generatedAt)}`,
      html: renderHtml(report),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Resend API error: ${body}` };
  }

  return { error: null };
}
