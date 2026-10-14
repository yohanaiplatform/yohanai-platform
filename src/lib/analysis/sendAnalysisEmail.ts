// src/lib/analysis/sendAnalysisEmail.ts

import type { AnalysisFinding, AnalysisMetrics } from "@/lib/analysis/types";

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const num = (n: number) => n.toLocaleString("id-ID");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "-");

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return `<p style="font-size:12px;color:#6B7280;">Belum ada data.</p>`;
  const th = headers.map((h) => `<th align="left" style="padding:6px 8px;font-size:11px;color:#6B7280;border-bottom:1px solid #E5E7EB;">${esc(h)}</th>`).join("");
  const tr = rows
    .map((r) => `<tr>${r.map((c) => `<td style="padding:6px 8px;font-size:12px;color:#111827;border-bottom:1px solid #F3F4F6;">${esc(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${th}</tr>${tr}</table>`;
}

function topicSection(m: AnalysisMetrics): string {
  const tp = m.topics;
  if (!tp) return "";
  const rows = tp.rows
    .filter((r) => r.enough)
    .map((r) => [
      r.label,
      `${num(r.withHot)} dari ${num(r.withLeads)} (${pct(r.withHot, r.withLeads)})`,
      `${num(r.withoutHot)} dari ${num(r.withoutLeads)} (${pct(r.withoutHot, r.withoutLeads)})`,
    ]);
  const small = tp.rows.filter((r) => !r.enough).map((r) => r.label);
  const before = tp.beforeHot.map((b) => `${b.label} (${num(b.count)})`).join(", ");
  return `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px;margin-bottom:12px;"><div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:8px;">Pemicu naik Hot dari isi percakapan</div>
    <div style="font-size:12px;color:#374151;margin-bottom:6px;">${num(tp.leadsAnalyzed)} lead yang pernah chat, ${num(tp.hotLeads)} di antaranya sudah Hot/Closing/Booking. Proporsi yang mencapai Hot menurut topik yang pernah mereka tanyakan. Ini korelasi, bukan sebab-akibat, dan jumlah lead Hot masih kecil.</div>
    ${table(["Topik", "Yang menanyakan: Hot", "Yang tidak: Hot"], rows)}
    ${small.length ? `<div style="font-size:11px;color:#6B7280;margin-top:6px;">Belum cukup data: ${esc(small.join(", "))}.</div>` : ""}
    ${tp.beforeHotSample > 0 ? `<div style="font-size:11px;color:#6B7280;margin-top:4px;">Topik yang sudah disebut sebelum naik ke Hot (${num(tp.beforeHotSample)} lead, petunjuk awal): ${esc(before || "-")}.</div>` : ""}</div>`;
}

export function renderAnalysisHtml(input: {
  periodStart: string;
  periodEnd: string;
  metrics: AnalysisMetrics;
  headline: string | null;
  findings: AnalysisFinding[];
}): string {
  const { metrics: m } = input;
  const findings = input.findings.length
    ? input.findings
        .map(
          (f) => `<div style="margin-bottom:12px;"><div style="font-size:14px;font-weight:700;color:#111827;">${esc(f.title)}</div><div style="font-size:13px;color:#374151;margin-top:2px;">${esc(f.detail)}</div>${
            f.action ? `<div style="font-size:12px;color:#065F46;margin-top:3px;">Saran: ${esc(f.action)}</div>` : ""
          }</div>`
        )
        .join("")
    : `<p style="font-size:13px;color:#6B7280;">Ringkasan AI tidak tersedia minggu ini; angka lengkap ada di bawah.</p>`;

  const funnelRows = m.funnel.current.map((c) => [c.label, num(c.count), pct(c.count, m.funnel.total)]);
  const transitionRows = m.funnel.transitions.map((t) => [t.label, num(t.count)]);
  const sourceRows = m.sources.rows.map((s) => [
    s.label,
    num(s.leads),
    s.enough ? pct(s.hotWarm, s.leads) : "sampel kecil",
    s.enough ? pct(s.hot, s.leads) : "-",
    num(s.closing),
  ]);

  const section = (title: string, body: string) =>
    `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px;margin-bottom:12px;"><div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:8px;">${esc(title)}</div>${body}</div>`;

  return `<div style="background:#F9FAFB;padding:20px 0;font-family:Arial,sans-serif;"><div style="max-width:640px;margin:0 auto;padding:0 12px;">
    <div style="font-size:11px;color:#6B7280;">Analisis Mingguan Yohan.AI &middot; ${esc(input.periodStart)} s/d ${esc(input.periodEnd)}</div>
    <div style="font-size:20px;font-weight:700;color:#111827;margin:4px 0 14px;">${esc(input.headline ?? "Analisis perilaku calon pembeli")}</div>
    ${section("Temuan utama", findings)}
    ${section(
      "Corong dan kecepatan",
      `<div style="font-size:12px;color:#374151;margin-bottom:6px;">Perpindahan Temperature ${m.days} hari: ${num(m.funnel.transitionsAuto)} otomatis (AI), ${num(m.funnel.transitionsManual)} manual. ${
        m.funnel.medianHoursToHot !== null
          ? `Median lead sampai pertama kali Hot: ${(m.funnel.medianHoursToHot / 24).toFixed(1)} hari (sampel ${num(m.funnel.hotSample)} lead, riwayat baru sejak 4 Okt).`
          : "Waktu sampai Hot belum bisa dihitung (belum ada riwayat)."
      } Lead Hot/Warm dengan percakapan: ${num(m.funnel.hotWarmWithChat)}; ${num(m.funnel.stalledHotWarm)} tanpa pesan lebih dari 5 hari; ${num(m.ai.unansweredHotWarm)} menunggu balasan.</div>
      ${table(["Temperature", "Jumlah", "Porsi"], funnelRows)}<div style="height:8px;"></div>${table(["Perpindahan", "Jumlah"], transitionRows)}`
    )}
    ${topicSection(m)}
    ${section(
      `Kualitas per sumber (lead ${m.sources.cohortDays} hari terakhir, ${num(m.sources.cohortLeads)} lead)`,
      `${table(["Sumber", "Lead", "Hot+Warm", "Hot", "Closing"], sourceRows)}<div style="font-size:11px;color:#6B7280;margin-top:6px;">Perbandingan hanya untuk sumber dengan minimal ${m.sources.minSample} lead. Temperature = kondisi saat ini, bukan akhir proses.</div>`
    )}
    ${section(
      "Kinerja asisten AI",
      `<div style="font-size:12px;color:#374151;">${num(m.ai.runs)} proses (${num(m.ai.errors)} galat) menyentuh ${num(m.ai.leadsHandled)} lead. Keyakinan: ${num(m.ai.confidence.high)} tinggi, ${num(m.ai.confidence.medium)} sedang, ${num(m.ai.confidence.low)} rendah. ${num(m.ai.replySent)} balasan terkirim. Catatan "AI mentok": ${num(m.ai.followUpNotes)}. Pesan masuk ${num(m.ai.messagesFromCustomer)}, pesan dari AI/agen ${num(m.ai.messagesFromAgent)}.</div>`
    )}
    <div style="font-size:11px;color:#9CA3AF;">Analisis deskriptif otomatis. Angka dihitung kode; ringkasan ditulis AI dari angka itu. Hanya dikirim ke pemilik. <a href="https://yohanai.id/admin" style="color:#9CA3AF;">Master Admin</a></div>
  </div></div>`;
}

export async function sendAnalysisEmail(
  to: string,
  input: Parameters<typeof renderAnalysisHtml>[0]
): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { error: "RESEND_API_KEY/RESEND_FROM_EMAIL belum dikonfigurasi." };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Nama pengirim sendiri (alamat tetap dari RESEND_FROM_EMAIL), supaya tidak tampil sebagai "Daily Report".
        from: `Yohan.AI Analisis <${from.match(/<([^>]+)>/)?.[1] ?? from}>`,
        to,
        subject: `Analisis Mingguan Yohan.AI: ${input.headline ?? "perilaku calon pembeli"}`.slice(0, 180),
        html: renderAnalysisHtml(input),
      }),
    });
    if (!res.ok) return { error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal mengirim email" };
  }
}
