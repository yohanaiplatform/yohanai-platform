// src/app/(dashboard)/properties/[slug]/report/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingLeadKategoriMatch } from "@/components/property/ListingLeadKategoriMatch";
import {
  PropertyMarketingReportDateForm,
  PropertyMarketingReportPrintButton,
  PropertyMarketingReportNotes,
} from "@/components/property/PropertyMarketingReportControls";
import { getListingBySlug } from "@/lib/property/getListingBySlug";
import { getListingMetadataValue } from "@/lib/property/getListings";
import { getListingReport } from "@/lib/property/getListingReport";
import { createClient } from "@/lib/supabase/server";

interface ListingReportPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function ListingReportPage({ params, searchParams }: ListingReportPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: listing, error } = await getListingBySlug(supabase, slug);

  const backLink = (
    <Link
      href={`/properties/${slug}`}
      className="no-print inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Kembali ke listing
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-6 p-6">
        {backLink}
        <EmptyState title="Error" description="Gagal memuat data listing. Coba muat ulang halaman." />
      </div>
    );
  }

  if (!listing) {
    notFound();
  }

  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const dateFrom = sp.from || toDateInputValue(defaultFrom);
  const dateTo = sp.to || toDateInputValue(today);

  const owner = getListingMetadataValue<{ name: string | null; phone: string | null }>(
    listing.metadata,
    "owner"
  );
  const kategoriMatch = getListingMetadataValue<string[]>(listing.metadata, "lead_kategori_match") ?? [];

  const report = await getListingReport(
    supabase,
    listing.id,
    kategoriMatch,
    `${dateFrom}T00:00:00.000Z`,
    `${dateTo}T23:59:59.999Z`
  );

  const { data: userData } = await supabase.auth.getUser();
  let agentName = "-";
  let brandName: string | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .schema("auth_ext")
      .from("profiles")
      .select("first_name, last_name, brand_name")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (profile) {
      agentName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "-";
      brandName = profile.brand_name;
    }
  }
  // Fallback ke nama agent kalau Nama Brand belum diisi di Profile --
  // JANGAN hardcode "Griya Indonesia" di sini, platform ini dipakai bisnis
  // lain juga (lihat memory multi-tenant-forward-compat).
  const reportBrandName = brandName || agentName;

  const tanggalDilaporkan = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6 p-6">
      {backLink}

      <SectionCard
        title="Laporan Pemasaran"
        description="Konfigurasi dulu Kategori Lead yang terkait listing ini, lalu atur rentang tanggal sebelum cetak/export."
        action={<PropertyMarketingReportPrintButton />}
        className="no-print"
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">Kategori Lead yang Terkait Listing Ini</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Lead dengan Kategori ini otomatis masuk laporan. Lead dengan Kategori terlalu umum (mis.
              &quot;Kons. Cari Rumah Murah&quot;) bisa dikaitkan manual satu-satu lewat halaman Lead Detail
              (&quot;Kaitkan ke Listing&quot;).
            </p>
            <ListingLeadKategoriMatch listingId={listing.id} metadata={listing.metadata} kategoriMatch={kategoriMatch} />
          </div>
          <PropertyMarketingReportDateForm slug={slug} dateFrom={dateFrom} dateTo={dateTo} />
        </div>
      </SectionCard>

      {report.error ? (
        <EmptyState title="Error" description="Gagal memuat data lead untuk laporan ini." />
      ) : (
        <div className="print-area mx-auto max-w-4xl space-y-4 rounded-2xl border border-border bg-background p-6 text-sm print:border-none print:p-0">
          <div className="flex items-start justify-between border-b border-border pb-3">
            <div>
              <h1 className="text-2xl font-bold">LAPORAN PEMASARAN</h1>
              <p className="text-sm italic text-muted-foreground">Marketing Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{reportBrandName}</p>
              <p className="text-xs text-muted-foreground">yohanai.id</p>
            </div>
          </div>

          <div className="rounded-lg border border-border">
            <div className="rounded-t-lg bg-muted px-4 py-1.5 text-sm font-semibold">Properti / Listing</div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 p-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Judul Properti</p>
                <p className="font-medium">{listing.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dilaporkan Kepada</p>
                <p className="font-medium">{owner?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alamat</p>
                <p className="font-medium">{listing.address || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nomor Telepon</p>
                <p className="font-medium">{owner?.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Periode Laporan</p>
                <p className="font-medium">
                  {new Date(dateFrom).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  {" s/d "}
                  {new Date(dateTo).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border">
            <div className="rounded-t-lg bg-muted px-4 py-1.5">
              <p className="text-sm font-semibold">Data Prospek</p>
              <p className="text-xs text-muted-foreground">
                {report.totalLeads > report.leads.length
                  ? `Menampilkan ${report.leads.length} dari ${report.totalLeads} lead paling baru di periode ini.`
                  : `${report.totalLeads} lead di periode ini.`}
              </p>
            </div>
            {report.leads.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Tidak ada lead yang tercatat untuk listing ini pada periode yang dipilih.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] text-muted-foreground">
                      <th className="px-3 py-1.5 font-medium">Nama</th>
                      <th className="px-3 py-1.5 font-medium">Keterangan</th>
                      <th className="px-3 py-1.5 font-medium">Telepon</th>
                      <th className="px-3 py-1.5 font-medium">Agent</th>
                      <th className="px-3 py-1.5 font-medium">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-3 py-1.5 font-medium">{lead.nama}</td>
                        <td className="max-w-[220px] truncate px-3 py-1.5 text-muted-foreground">{lead.keterangan}</td>
                        <td className="whitespace-nowrap px-3 py-1.5">{lead.phoneMasked}</td>
                        <td className="whitespace-nowrap px-3 py-1.5">{lead.agentName}</td>
                        <td className="whitespace-nowrap px-3 py-1.5">{lead.tanggalInput}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border">
            <div className="rounded-t-lg bg-muted px-4 py-1.5 text-sm font-semibold">Sumber Informasi</div>
            <div className="space-y-1.5 p-3">
              {report.sumberBreakdown.map((row) => (
                <div key={row.label} className="flex items-center gap-3 text-xs">
                  <span className="w-48 shrink-0 text-muted-foreground">{row.label}</span>
                  <span className="w-8 shrink-0 text-right font-medium">{row.count}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded bg-muted">
                    <div className="h-full bg-red-500" style={{ width: `${row.percent}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-muted-foreground">{row.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <PropertyMarketingReportNotes />

          <div className="flex items-end justify-between border-t border-border pt-3 text-xs">
            <p className="text-xs text-muted-foreground">
              Laporan dibuat otomatis dari data lead Yohan.AI Platform pada {tanggalDilaporkan}.
            </p>
            <div className="text-right">
              <p className="mb-4">Tanggal: {tanggalDilaporkan}</p>
              <p className="font-semibold">{agentName}</p>
              <p className="text-xs italic text-muted-foreground">Property Agent</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
