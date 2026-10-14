// src/app/(dashboard)/properties/[slug]/documents/kwitansi/page.tsx

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { KwitansiEditor } from "@/components/property/KwitansiEditor";
import { SetBreadcrumbLabel } from "@/components/layout/BreadcrumbLabels";
import { getListingBySlug } from "@/lib/property/getListingBySlug";
import { createClient } from "@/lib/supabase/server";
import { docLogoUrl, getUserBranding } from "@/lib/branding/branding";
import { parseParty2 } from "@/lib/documents/mouTypes";
import { PAYMENT_PURPOSES, type KwitansiForm } from "@/lib/documents/kwitansiTypes";

interface KwitansiPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ doc?: string }>;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Tanggal hari ini (WIB) YYYY-MM-DD -- di luar komponen supaya tidak dianggap fungsi tidak murni saat render. */
function todayWib(): string {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

function formatHistoryDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

export default async function KwitansiPage({ params, searchParams }: KwitansiPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing, error } = await getListingBySlug(supabase, slug);

  const backLink = (
    <Link href={`/properties/${slug}`} className="no-print inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
  if (!listing) notFound();

  const [{ data: settingsRow }, { data: profile }, { data: docs }] = await Promise.all([
    supabase.schema("property").from("document_settings").select("data").eq("user_id", user.id).maybeSingle(),
    supabase.schema("auth_ext").from("profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle(),
    supabase
      .schema("property")
      .from("documents")
      .select("id, doc_number, created_at, data")
      .eq("listing_id", listing.id)
      .eq("doc_type", "kwitansi_booking")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const party2 = parseParty2(settingsRow?.data);
  if (!party2.agentName) party2.agentName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  const initialForm: KwitansiForm = {
    buyer: { name: "", phone: "", address: "" },
    unit: { projectName: listing.title, unitLabel: "", type: "", price: String(Math.round(listing.price)), purchaseMethod: "KPR", totalDp: "" },
    payment: {
      amount: "",
      purpose: "Booking",
      purposeCustom: "",
      previouslyPaid: "",
      method: "Transfer",
      date: todayWib(),
      notes: "",
    },
    party2,
    signPlace: "",
  };

  // ?doc=id memuat kwitansi dari riwayat; tanpa itu mulai kwitansi baru (nomor otomatis), dengan kota dari yang terakhir.
  const chosen = sp.doc ? docs?.find((d) => d.id === sp.doc) : undefined;
  const saved = (chosen?.data ?? docs?.[0]?.data) as { form?: Partial<KwitansiForm> } | null | undefined;
  let initialNumber = "";
  if (chosen && saved?.form) {
    const f = saved.form;
    initialForm.buyer = { ...initialForm.buyer, ...(f.buyer ?? {}) };
    // Kwitansi lama (sebelum ada metode pembelian) dihitung dari harga unit = Cash.
    initialForm.unit = { ...initialForm.unit, purchaseMethod: "Cash", ...(f.unit ?? {}) };
    initialForm.payment = { ...initialForm.payment, ...(f.payment ?? {}) };
    // Kwitansi lama menyimpan "untuk pembayaran" sebagai teks bebas: tampilkan sebagai Lainnya agar teksnya tidak hilang.
    if (!(PAYMENT_PURPOSES as readonly string[]).includes(initialForm.payment.purpose)) {
      initialForm.payment.purposeCustom = initialForm.payment.purpose;
      initialForm.payment.purpose = "Lainnya";
    }
    initialForm.signPlace = f.signPlace ?? "";
    initialNumber = chosen.doc_number ?? "";
  } else if (saved?.form?.signPlace) {
    initialForm.signPlace = saved.form.signPlace;
  }

  const history = (docs ?? []).map((d) => ({ id: d.id, docNumber: d.doc_number, createdAt: formatHistoryDate(d.created_at) }));

  return (
    <div className="space-y-6 p-6 print:p-0">
      <SetBreadcrumbLabel segment={listing.slug} label={listing.title} />
      <div className="no-print space-y-1">
        {backLink}
        <h1 className="text-2xl font-bold tracking-tight">Kwitansi Pembayaran Unit</h1>
        <p className="text-sm text-muted-foreground">
          {listing.title}. Pilih tujuan pembayaran (Booking, Angsuran, dll), isi data pembeli dan nominal; terbilang dan nomor kwitansi dibuat otomatis.
        </p>
      </div>
      <KwitansiEditor
        logoUrl={docLogoUrl(await getUserBranding(supabase, user.id))}
        listingId={listing.id}
        slug={listing.slug}
        initialForm={initialForm}
        listing={{ title: listing.title }}
        initialNumber={initialNumber}
        history={history}
      />
    </div>
  );
}
