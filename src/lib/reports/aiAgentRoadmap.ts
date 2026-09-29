// src/lib/reports/aiAgentRoadmap.ts

/**
 * AI Agent belum dibangun sama sekali (Task 015 di docs/status.mdx masih
 * di-hold, keputusan arsitektur LLM/provider belum diambil). Daftar ini
 * BUKAN data nyata -- diambil langsung dari "Planned AI Features" di
 * docs/modules/ai.mdx, ditampilkan di Daily Report & Platform Report
 * supaya Yohan (dan user lain) tetap lihat arah rencananya tiap hari,
 * jelas ditandai sebagai rencana/contoh, bukan angka yang benar-benar
 * dihitung sistem. Kalau AI Agent beneran dibangun nanti, bagian ini
 * diganti data live (pola sama seperti Follow-up Backlog/Lead Beku dulu
 * placeholder, sekarang nyata).
 */
export const AI_AGENT_DOCS_URL = "https://docs.yohanai.id/modules/ai";

export const AI_AGENT_PLANNED_KPIS: Array<{ name: string; description: string }> = [
  { name: "Lead Score", description: "Skor kualitas tiap lead berdasarkan histori & perilaku" },
  { name: "Buyer Persona", description: "Pengelompokan calon pembeli berdasarkan karakteristik & kebutuhan" },
  { name: "Buying Signal Detection", description: "Deteksi sinyal minat dari aktivitas & komunikasi" },
  { name: "Next Best Action", description: "Rekomendasi tindakan terbaik berikutnya untuk agent" },
  { name: "Conversion Prediction", description: "Perkiraan peluang closing berdasarkan pola histori" },
  { name: "Property Recommendation", description: "Rekomendasi listing paling sesuai kebutuhan lead" },
];

/** Sample ilustratif yang sudah dipakai di kartu "Buyer Behavior Insight" (getDashboardInsights.ts) -- dipakai ulang di sini, bukan contoh baru yang dikarang. */
export const AI_AGENT_SAMPLE_INSIGHT =
  "Contoh dari dashboard: \"Lead #8821 viewed pricing page 3 times in the last hour, indicating high purchase intent.\" -- ilustrasi, bukan lead sungguhan.";

/** HTML list KPI yang direncanakan -- dipakai bareng oleh Daily Report (personal) & Platform Report (developer), dibungkus sectionCard masing-masing file supaya gaya visualnya konsisten dengan bagian lain di email itu. */
export function renderAiAgentKpiListHtml(): string {
  const items = AI_AGENT_PLANNED_KPIS.map(
    (kpi) => `
      <tr>
        <td style="padding:5px 0;font-size:12px;color:#111827;font-weight:600;white-space:nowrap;padding-right:10px;">${kpi.name}</td>
        <td style="padding:5px 0;font-size:12px;color:#6B7280;">${kpi.description}</td>
      </tr>`
  ).join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
    <p style="font-size:11px;color:#9CA3AF;margin:10px 0 0;font-style:italic;">${AI_AGENT_SAMPLE_INSIGHT}</p>
    <p style="font-size:11px;color:#9CA3AF;margin:6px 0 0;">
      <strong>Belum aktif.</strong> Ini daftar rencana dari dokumentasi (docs/modules/ai.mdx), bukan angka yang dihitung sistem -- AI Agent belum dibangun (keputusan arsitektur LLM/provider masih terbuka).
    </p>`;
}
