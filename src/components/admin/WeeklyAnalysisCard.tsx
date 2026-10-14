// src/components/admin/WeeklyAnalysisCard.tsx

import { SectionCard } from "@/components/ui/section-card";
import { RunAnalysisButton } from "@/components/admin/RunAnalysisButton";
import type { AnalysisFinding, AnalysisMetrics } from "@/lib/analysis/types";

export interface WeeklyAnalysisRecord {
  period_start: string;
  period_end: string;
  headline: string | null;
  findings: AnalysisFinding[];
  metrics: AnalysisMetrics;
  created_at: string;
}

const num = (n: number) => n.toLocaleString("id-ID");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "-");

/** Hasil Data Analysis Agent (mingguan) untuk Master Admin. Hanya tampil di layar, tidak ikut laporan cetak. */
export function WeeklyAnalysisCard({ report }: { report: WeeklyAnalysisRecord | null }) {
  if (!report) {
    return (
      <SectionCard title="Analisis perilaku calon pembeli" description="Analisis mingguan otomatis oleh Data Analysis Agent.">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Belum ada analisis. Analisis dibuat otomatis Senin pagi (07.00 WIB) dan dikirim ke email pemilik, atau buat sekarang.
          </p>
          <RunAnalysisButton />
        </div>
      </SectionCard>
    );
  }
  const m = report.metrics;
  const created = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(report.created_at));

  return (
    <SectionCard
      title="Analisis perilaku calon pembeli"
      description={`Data Analysis Agent, periode ${report.period_start} s/d ${report.period_end} (dibuat ${created} WIB). Deskriptif: apa yang terjadi, bukan prediksi.`}
    >
      <div className="space-y-4 text-sm">
        <RunAnalysisButton />
        <p className="text-base font-semibold">{report.headline ?? "Ringkasan AI tidak tersedia minggu ini"}</p>
        {report.findings.length > 0 && (
          <ul className="space-y-3">
            {report.findings.map((f) => (
              <li key={f.title}>
                <p className="font-medium">{f.title}</p>
                <p className="text-muted-foreground">{f.detail}</p>
                {f.action && <p className="text-emerald-700 dark:text-emerald-400">Saran: {f.action}</p>}
              </li>
            ))}
          </ul>
        )}

        {m.topics && m.topics.rows.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Pemicu naik Hot ({num(m.topics.leadsAnalyzed)} lead pernah chat, {num(m.topics.hotLeads)} Hot/Closing)
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">Topik ditanyakan</th>
                  <th className="py-1 pr-2 font-medium">Yang menanyakan: Hot</th>
                  <th className="py-1 pr-2 font-medium">Yang tidak: Hot</th>
                </tr>
              </thead>
              <tbody>
                {m.topics.rows.map((r) => (
                  <tr key={r.label} className="border-t">
                    <td className="py-1 pr-2">{r.label}</td>
                    <td className="py-1 pr-2 tabular-nums">{r.enough ? `${num(r.withHot)} dari ${num(r.withLeads)} (${pct(r.withHot, r.withLeads)})` : "sampel kecil"}</td>
                    <td className="py-1 pr-2 tabular-nums">{r.enough ? `${num(r.withoutHot)} dari ${num(r.withoutLeads)} (${pct(r.withoutHot, r.withoutLeads)})` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-muted-foreground">Korelasi, bukan sebab-akibat; jumlah lead Hot masih kecil sehingga selisih bisa kebetulan.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Kualitas per sumber (lead {m.sources.cohortDays} hari)</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">Sumber</th>
                  <th className="py-1 pr-2 font-medium">Lead</th>
                  <th className="py-1 pr-2 font-medium">Hot+Warm</th>
                </tr>
              </thead>
              <tbody>
                {m.sources.rows.map((s) => (
                  <tr key={s.label} className="border-t">
                    <td className="py-1 pr-2">{s.label}</td>
                    <td className="py-1 pr-2 tabular-nums">{num(s.leads)}</td>
                    <td className="py-1 pr-2 tabular-nums">{s.enough ? pct(s.hotWarm, s.leads) : "sampel kecil"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1 text-xs">
            <p className="mb-1 font-semibold uppercase text-muted-foreground">Corong dan AI ({m.days} hari)</p>
            <p>
              Perpindahan Temperature: {num(m.funnel.transitionsAuto)} otomatis, {num(m.funnel.transitionsManual)} manual.
            </p>
            <p>
              Median sampai Hot: {m.funnel.medianHoursToHot !== null ? `${(m.funnel.medianHoursToHot / 24).toFixed(1)} hari (sampel ${num(m.funnel.hotSample)})` : "belum ada data"}.
            </p>
            <p>
              Lead Hot/Warm: {num(m.funnel.stalledHotWarm)} sepi &gt;5 hari, {num(m.ai.unansweredHotWarm)} menunggu balasan (dari {num(m.funnel.hotWarmWithChat)} dengan percakapan).
            </p>
            <p>
              AI: {num(m.ai.runs)} proses, {num(m.ai.errors)} galat, keyakinan rendah {num(m.ai.confidence.low)}, catatan mentok {num(m.ai.followUpNotes)}.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
