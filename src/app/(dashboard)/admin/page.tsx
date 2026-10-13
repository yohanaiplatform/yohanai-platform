// src/app/(dashboard)/admin/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canViewPlatformDashboard } from "@/lib/admin/platformAccess";
import { getLeadGrowth } from "@/lib/admin/getLeadGrowth";
import { getPlatformOverview } from "@/lib/admin/getPlatformOverview";
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

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "-");

const CAPABILITIES: { title: string; text: string }[] = [
  { title: "Asisten AI WhatsApp 24 jam", text: "Menjawab calon pembeli otomatis, memahami minat dan anggaran, menilai Temperature lead, mengirim foto listing, dan menyerahkan ke agen bila perlu." },
  { title: "CRM lead terpusat", text: "Satu daftar lead dengan riwayat percakapan, Temperature (Cold/Warm/Hot/Closing), penugasan agen, dan sinkron otomatis ke Google Contacts." },
  { title: "Manajemen listing & laporan pemasaran", text: "Katalog properti dengan foto, peta, dan data pemilik; laporan pemasaran otomatis untuk pemilik/vendor." },
  { title: "Kalkulator KPR & data peta", text: "Simulasi angsuran dihitung oleh kode (bukan ditebak AI) serta jarak ke fasilitas sekitar lewat data peta sungguhan." },
  { title: "Nurturing otomatis", text: "Tindak lanjut lead yang diam dengan aturan konservatif per agen (jeda 48 jam, batas kirim, jam sopan)." },
  { title: "Basis pengetahuan yang belajar", text: "AI mengusulkan topik yang belum terjawab; jawaban final selalu disetujui manusia sebelum dipakai." },
  { title: "Ambil alih manusia kapan saja", text: "Agen dapat menjeda AI per lead; AI diam saat agen menjawab langsung dan lanjut setelah dikembalikan." },
  { title: "Laporan & pemantauan biaya", text: "Laporan harian per agen, rangkuman chat tiga kali sehari, pemantauan biaya AI dan saldo kredit." },
];

/** Header halaman cetak: logo + judul bagian. Hanya tampil saat cetak. */
function PrintPageHeader({ title, subtitle, first }: { title: string; subtitle: string; first?: boolean }) {
  return (
    <div className="mb-2 hidden items-center justify-between border-b-2 border-foreground pb-2 print:flex">
      <div>
        <h1 className={first ? "text-3xl font-bold tracking-tight" : "text-xl font-bold tracking-tight"}>{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Logo variant="light" className={first ? "h-14" : "h-8"} />
    </div>
  );
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

  const [summary, series, growth, overview, snapshotsRes] = await Promise.all([
    getAiUsageSummary(admin, startISO, endISO),
    getAiDailySeries(admin, 30),
    getLeadGrowth(admin),
    getPlatformOverview(admin),
    admin
      .schema("core")
      .from("platform_snapshots")
      .select("snapshot_date, db_size_bytes, storage_size_bytes, users_total, leads_total, listings_total")
      .order("snapshot_date", { ascending: false })
      .limit(60),
  ]);
  const credit = await getAiCreditStatus(admin, summary.weekly.costUsd / 7);
  const snapshots = [...(snapshotsRes.data ?? [])].reverse();
  const cost30 = series.reduce((sum, p) => sum + p.costUsd, 0);
  const costPerNewLead = growth.last30 > 0 ? cost30 / growth.last30 : 0;
  const activeLeads = overview.leads.hot + overview.leads.warm;
  const sinceText = overview.firstLeadDate
    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(overview.firstLeadDate))
    : "-";
  const weekTrend = trend(growth.last7, growth.prev7);
  const funnel = [
    { label: "Hot", value: overview.leads.hot, cls: "bg-red-500" },
    { label: "Warm", value: overview.leads.warm, cls: "bg-amber-500" },
    { label: "Cold", value: overview.leads.cold, cls: "bg-sky-500" },
    { label: "Closing", value: overview.leads.closing, cls: "bg-emerald-600" },
    { label: "Batal", value: overview.leads.batal, cls: "bg-slate-400" },
  ];
  const funnelTotal = Math.max(1, funnel.reduce((sum, x) => sum + x.value, 0));

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
      <section className="space-y-4 print:space-y-3 print:break-after-page">
        <PrintPageHeader first title="LAPORAN PLATFORM" subtitle="Yohan.AI -- Property Buyer Behavior Intelligence Platform" />
        <div className="hidden flex-wrap justify-between gap-2 text-xs text-muted-foreground print:flex">
          <span>Dicetak: {printedAtWib()} WIB</span>
          <span>Disiapkan oleh: {user.email}</span>
          <span>yohanai.id</span>
        </div>
        <PrintNote />

        <SectionCard title="Ringkasan eksekutif" description="Gambaran kondisi bisnis dan teknologi platform per tanggal cetak.">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
            <StatCard title="Total lead" value={num(overview.leads.total)} description={`sejak ${sinceText}`} />
            <StatCard title="Lead baru 30 hari" value={num(growth.last30)} trend={weekTrend} />
            <StatCard title="Prospek aktif (Hot + Warm)" value={num(activeLeads)} description={`${pct(activeLeads, overview.leads.total)} dari seluruh lead`} />
            <StatCard title="Closing" value={num(overview.leads.closing)} description={`rasio ${pct(overview.leads.closing, overview.leads.total)}`} />
            <StatCard title="Listing tersedia" value={num(overview.listings.available)} description={`dari ${num(overview.listings.total)} listing`} />
            <StatCard title="Pesan WhatsApp 30 hari" value={num(overview.chat.messages30d)} description={`${num(overview.chat.customer30d)} dari calon pembeli`} />
            <StatCard title="Balasan AI 30 hari" value={num(overview.chat.aiRuns30d)} description={`total ${num(overview.chat.aiRunsTotal)} sejak aktif`} />
            <StatCard title="Biaya AI per lead baru" value={costPerNewLead > 0 ? usd(costPerNewLead) : "-"} description="rata-rata 30 hari" />
          </div>
        </SectionCard>

        <SectionCard title="Sorotan" description="Poin utama yang dihitung otomatis dari data.">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            <li>
              Basis calon pembeli mencapai <strong>{num(overview.leads.total)} lead</strong>, bertambah <strong>{num(growth.last30)}</strong> dalam 30 hari terakhir
              ({num(growth.last7)} minggu ini, {weekTrend.value}).
            </li>
            <li>
              <strong>{num(activeLeads)} lead</strong> berstatus Hot/Warm ({pct(activeLeads, overview.leads.total)}) siap ditindaklanjuti; {num(overview.leads.closing)} sudah
              Closing.
            </li>
            <li>
              Asisten AI telah membalas <strong>{num(overview.chat.aiRunsTotal)} pesan</strong>{overview.chat.aiRunsTotal > overview.chat.aiRuns30d ? ` (${num(overview.chat.aiRuns30d)} dalam 30 hari)` : " sejak diaktifkan"} dengan biaya rata-rata sekitar{" "}
              <strong>${summary.avgCostPerMessageUsd.toFixed(3)} per pesan</strong> -- biaya bulan ini {usd(summary.monthly.costUsd)}.
            </li>
            <li>
              Portofolio {num(overview.listings.total)} listing ({num(overview.listings.available)} tersedia{overview.listings.booked > 0 ? `, ${num(overview.listings.booked)} dipesan` : ""}{overview.listings.sold > 0 ? `, ${num(overview.listings.sold)} terjual` : ""}), dilayani {num(overview.users)} akun pengguna.
            </li>
          </ul>
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
          <SectionCard title="Sebaran Temperature lead" description="Tingkat kesiapan membeli.">
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
              {funnel.map((x) => (
                <div key={x.label} className={x.cls} style={{ width: `${(x.value / funnelTotal) * 100}%` }} title={`${x.label}: ${x.value}`} />
              ))}
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {funnel.map((x) => (
                <li key={x.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${x.cls}`} />
                    {x.label}
                  </span>
                  <span className="font-semibold">
                    {num(x.value)} <span className="font-normal text-muted-foreground">({pct(x.value, funnelTotal)})</span>
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Sumber lead (sepanjang waktu)" description="Dari mana calon pembeli datang.">
            {growth.bySourceAll.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {growth.bySourceAll.map((x) => (
                  <li key={x.label}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{x.label}</span>
                      <span className="font-semibold">
                        {num(x.value)} <span className="font-normal text-muted-foreground">({pct(x.value, growth.total)})</span>
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-brand" style={{ width: `${(x.value / Math.max(1, growth.bySourceAll[0].value)) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </section>


      {(credit.level === "critical" || credit.level === "warn") && (
        <div
          className={`print:hidden rounded-xl border p-4 text-sm ${
            credit.level === "critical" ? "border-red-300 bg-red-50 text-red-900" : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <strong>{credit.level === "critical" ? "Saldo kredit Claude hampir habis." : "Saldo kredit Claude diperkirakan habis dalam seminggu."}</strong>{" "}
          Taksiran sisa {creditText}. Isi saldo atau aktifkan auto-reload di Claude Console, Billing, lalu catat saldo terbaru di Settings.
        </div>
      )}

      <PrintSection id="leads">
      <PrintPageHeader title="Pertumbuhan Lead" subtitle="Tren perolehan calon pembeli harian, mingguan, dan bulanan" />
      <SectionCard title="Pertumbuhan lead" description="Semua agen, lead yang tidak dihapus. Tanggal mengikuti waktu WIB.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-2 print-avoid-break">
          <StatCard title="Total lead" value={num(growth.total)} />
          <StatCard title="Lead baru 7 hari" value={num(growth.last7)} trend={trend(growth.last7, growth.prev7)} />
          <StatCard title="Lead baru 30 hari" value={num(growth.last30)} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 print:mt-3 print:grid-cols-2 print:gap-4 print-avoid-break">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Lead baru per hari (30 hari)</h3>
            <MiniBars points={growth.perDay} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Lead baru per minggu (12 minggu, tanggal = Senin)</h3>
            <MiniBars points={growth.perWeek} barClassName="bg-emerald-500" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 print:mt-3 print:grid-cols-2 print:gap-4 print-avoid-break">
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

      <PrintSection id="ai">
      <PrintPageHeader title="AI Agent & Efisiensi Biaya" subtitle="Pemakaian asisten AI WhatsApp dan taksiran biayanya" />
      <SectionCard title="Biaya & pemakaian AI" description="AI Agent WhatsApp dan panggilan Claude lain. Sumber: riwayat pemakaian di aplikasi.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2 print-avoid-break">
          <StatCard
            className="print:hidden"
            title="Saldo kredit (taksiran)"
            value={credit.estimatedRemainingUsd === null ? "Belum dicatat" : usd(credit.estimatedRemainingUsd)}
            description={credit.daysLeft !== null ? `~${Math.floor(credit.daysLeft)} hari lagi` : credit.recordedAt ? "dari catatan terakhir" : "catat di Settings"}
          />
          <StatCard title="Biaya bulan ini" value={usd(summary.monthly.costUsd)} description={`proyeksi akhir bulan ${usd(summary.monthlyProjectionUsd)}`} />
          <StatCard title="Biaya 7 hari" value={usd(summary.weekly.costUsd)} description={`${num(summary.weekly.messages)} pesan`} />
          <StatCard title="Rata-rata per pesan" value={`$${summary.avgCostPerMessageUsd.toFixed(4)}`} description="bulan ini" />
          <StatCard className="hidden print:block" title="Biaya AI 30 hari" value={usd(cost30)} description={`~${usd(costPerNewLead)} per lead baru`} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 print:mt-3 print:grid-cols-2 print:gap-4 print-avoid-break">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Biaya per hari (30 hari)</h3>
            <MiniBars points={series.map((p) => ({ label: p.date.slice(8, 10) + "/" + p.date.slice(5, 7), value: p.costUsd }))} format={(n) => `$${n.toFixed(2)}`} barClassName="bg-amber-500" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Pesan AI per hari (30 hari)</h3>
            <MiniBars points={series.map((p) => ({ label: p.date.slice(8, 10) + "/" + p.date.slice(5, 7), value: p.messages }))} />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-md border border-border print:mt-3 print-avoid-break">
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
          <div className="mt-4 text-sm print:hidden">
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

      <PrintSection id="system">
      <PrintPageHeader title="Kapabilitas & Infrastruktur" subtitle="Apa yang sudah berjalan di platform dan kondisi sistemnya" />
      <SectionCard title="Kapabilitas yang sudah berjalan" description="Fitur yang aktif dipakai tim lapangan.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="print-avoid-break rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">{c.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4 print:gap-2">
          <StatCard title="Akun pengguna" value={num(overview.users)} />
          <StatCard title="Percakapan WhatsApp" value={num(overview.chat.conversations)} description={`${num(overview.chat.messagesTotal)} pesan total`} />
          <StatCard title="Basis pengetahuan AI" value={num(overview.knowledge.entries)} description="entri disetujui" />
          <StatCard title="Kamus kawasan" value={num(overview.knowledge.places)} description="lokasi disetujui" />
        </div>
      </SectionCard>
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
