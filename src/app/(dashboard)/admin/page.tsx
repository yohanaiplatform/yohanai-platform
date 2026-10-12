// src/app/(dashboard)/admin/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canViewPlatformDashboard } from "@/lib/admin/platformAccess";
import { getLeadGrowth } from "@/lib/admin/getLeadGrowth";
import { getReportDayWindow } from "@/lib/reports/getDailyReport";
import { getAiUsageSummary, getAiDailySeries } from "@/lib/reports/getAiUsageSummary";
import { getAiCreditStatus } from "@/lib/reports/getAiCreditStatus";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { MiniBars } from "@/components/admin/MiniBars";
import { Logo } from "@/components/layout/Logo";
import { PrintSettingsProvider, PrintControls, PrintSection, PrintNote } from "@/components/admin/AdminReportPrint";

export const dynamic = "force-dynamic";

const usd = (n: number) => `$${n.toFixed(n < 10 ? 2 : 1)}`;
const num = (n: number) => n.toLocaleString("id-ID");
const bytesToMb = (b: number) => b / (1024 * 1024);

function trend(current: number, previous: number): { value: string; direction: "up" | "down" | "neutral" } {
  if (previous === 0) return { value: current > 0 ? "baru" : "-", direction: current > 0 ? "up" : "neutral" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: `${pct > 0 ? "+" : ""}${pct}% vs 7 hari sebelumnya`, direction: pct > 0 ? "up" : pct < 0 ? "down" : "neutral" };
}

function printedAtWib(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

/** Master Admin: ringkasan AI/biaya, pertumbuhan lead, dan tren sistem. Admin atau akun dengan penanda laporan platform. */
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await canViewPlatformDashboard(supabase, user.id))) redirect("/dashboard");

  const admin = createAdminClient();
  const { startISO, endISO } = getReportDayWindow();

  const [summary, series, growth, snapshotsRes] = await Promise.all([
    getAiUsageSummary(admin, startISO, endISO),
    getAiDailySeries(admin, 30),
    getLeadGrowth(admin),
    admin
      .schema("core")
      .from("platform_snapshots")
      .select("snapshot_date, db_size_bytes, storage_size_bytes, users_total, leads_total, listings_total")
      .order("snapshot_date", { ascending: false })
      .limit(60),
  ]);
  const credit = await getAiCreditStatus(admin, summary.weekly.costUsd / 7);
  const snapshots = [...(snapshotsRes.data ?? [])].reverse();

  const creditText =
    credit.estimatedRemainingUsd === null
      ? "Belum dicatat"
      : `${usd(credit.estimatedRemainingUsd)}${credit.daysLeft !== null ? ` (~${Math.floor(credit.daysLeft)} hari)` : ""}`;

  return (
    <PrintSettingsProvider>
    <div className="admin-report space-y-6 p-6">
      <header className="no-print flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Master Admin</h1>
        <p className="text-muted-foreground">
          Ringkasan platform untuk pemilik: biaya dan pemakaian AI, pertumbuhan lead, dan tren sistem. Angka biaya adalah taksiran dari
          token yang tercatat, bukan tagihan resmi.
        </p>
      </header>

      <PrintControls />

      <div className="print-area space-y-6">
      <div className="hidden print:block print-avoid-break">
        <div className="flex items-start justify-between border-b-2 border-foreground pb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LAPORAN PLATFORM</h1>
            <p className="text-sm italic text-muted-foreground">Master Admin Report</p>
          </div>
          <div className="text-right">
            <Logo variant="light" className="ml-auto h-10" />
            <p className="mt-1 text-xs text-muted-foreground">yohanai.id</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>Dicetak: {printedAtWib()} WIB</span>
          <span>Oleh: {user.email}</span>
          <span>Biaya AI = taksiran dari token tercatat (bukan tagihan resmi) -- Rahasia, untuk internal</span>
        </div>
      </div>

      <PrintNote />

      {(credit.level === "critical" || credit.level === "warn") && (
        <div
          className={`print-avoid-break rounded-xl border p-4 text-sm ${
            credit.level === "critical" ? "border-red-300 bg-red-50 text-red-900" : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <strong>{credit.level === "critical" ? "Saldo kredit Claude hampir habis." : "Saldo kredit Claude diperkirakan habis dalam seminggu."}</strong>{" "}
          Taksiran sisa {creditText}. Isi saldo atau aktifkan auto-reload di Claude Console, Billing, lalu catat saldo terbaru di Settings.
        </div>
      )}

      <PrintSection id="ai">
      <SectionCard title="Biaya & pemakaian AI" description="AI Agent WhatsApp dan panggilan Claude lain. Sumber: riwayat pemakaian di aplikasi.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print-avoid-break">
          <StatCard title="Saldo kredit (taksiran)" value={creditText} description={credit.recordedAt ? "dari catatan saldo terakhir" : "catat di Settings"} />
          <StatCard title="Biaya bulan ini" value={usd(summary.monthly.costUsd)} description={`proyeksi akhir bulan ${usd(summary.monthlyProjectionUsd)}`} />
          <StatCard title="Biaya 7 hari" value={usd(summary.weekly.costUsd)} description={`${num(summary.weekly.messages)} pesan`} />
          <StatCard title="Rata-rata per pesan" value={`$${summary.avgCostPerMessageUsd.toFixed(4)}`} description="bulan ini" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print-avoid-break">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Biaya per hari (30 hari)</h3>
            <MiniBars points={series.map((p) => ({ label: p.date.slice(8, 10) + "/" + p.date.slice(5, 7), value: p.costUsd }))} format={(n) => `$${n.toFixed(2)}`} barClassName="bg-amber-500" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Pesan AI per hari (30 hari)</h3>
            <MiniBars points={series.map((p) => ({ label: p.date.slice(8, 10) + "/" + p.date.slice(5, 7), value: p.messages }))} />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-md border border-border print-avoid-break">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Periode</th>
                <th className="px-3 py-2 text-right">Pesan</th>
                <th className="px-3 py-2 text-right">Token (masuk / keluar)</th>
                <th className="px-3 py-2 text-right">Biaya</th>
                <th className="px-3 py-2 text-right">Template WA nurturing</th>
              </tr>
            </thead>
            <tbody>
              {[summary.daily, summary.weekly, summary.monthly].map((p) => (
                <tr key={p.label} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{p.label}</td>
                  <td className="px-3 py-2 text-right">{num(p.messages)}</td>
                  <td className="px-3 py-2 text-right">
                    {num(p.inputTokens)} / {num(p.outputTokens)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{usd(p.costUsd)}</td>
                  <td className="px-3 py-2 text-right">{num(p.nurtureSent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summary.topLeads.length > 0 && (
          <div className="mt-4 text-sm print-avoid-break">
            <h3 className="mb-1 font-semibold">Lead dengan biaya AI terbesar bulan ini</h3>
            <ul className="space-y-0.5 text-muted-foreground">
              {summary.topLeads.map((l) => (
                <li key={l.leadId}>
                  {l.name} -- {num(l.messages)} pesan, {usd(l.costUsd)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>
      </PrintSection>

      <PrintSection id="leads">
      <SectionCard title="Pertumbuhan lead" description="Semua agen, lead yang tidak dihapus. Tanggal mengikuti waktu WIB.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3 print-avoid-break">
          <StatCard title="Total lead" value={num(growth.total)} />
          <StatCard title="Lead baru 7 hari" value={num(growth.last7)} trend={trend(growth.last7, growth.prev7)} />
          <StatCard title="Lead baru 30 hari" value={num(growth.last30)} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print-avoid-break">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Lead baru per hari (30 hari)</h3>
            <MiniBars points={growth.perDay} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Lead baru per minggu (12 minggu, tanggal = Senin)</h3>
            <MiniBars points={growth.perWeek} barClassName="bg-emerald-500" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print-avoid-break">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Lead baru per bulan (sejak data pertama)</h3>
            <MiniBars points={growth.perMonth} barClassName="bg-sky-500" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Sumber lead (30 hari)</h3>
            {growth.bySource30.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {growth.bySource30.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3">
                    <span className="truncate">{s.label}</span>
                    <span className="font-semibold">{num(s.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SectionCard>
      </PrintSection>

      <PrintSection id="system">
      <SectionCard title="Tren sistem" description="Potret harian ukuran database dan storage. Mulai terkumpul sejak 12 Oktober 2026.">
        {snapshots.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Baru {snapshots.length} potret harian -- grafik muncul setelah minimal 2 hari data. Tren mingguan, bulanan, dan tahunan terisi seiring waktu.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2 print-avoid-break">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Ukuran database (MB)</h3>
              <MiniBars
                points={snapshots.map((s) => ({ label: s.snapshot_date.slice(8, 10) + "/" + s.snapshot_date.slice(5, 7), value: bytesToMb(Number(s.db_size_bytes ?? 0)) }))}
                format={(n) => `${n.toFixed(1)} MB`}
                barClassName="bg-violet-500"
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Ukuran storage (MB)</h3>
              <MiniBars
                points={snapshots.map((s) => ({ label: s.snapshot_date.slice(8, 10) + "/" + s.snapshot_date.slice(5, 7), value: bytesToMb(Number(s.storage_size_bytes ?? 0)) }))}
                format={(n) => `${n.toFixed(1)} MB`}
                barClassName="bg-rose-500"
              />
            </div>
          </div>
        )}
      </SectionCard>
      </PrintSection>
      </div>
    </div>
    </PrintSettingsProvider>
  );
}
