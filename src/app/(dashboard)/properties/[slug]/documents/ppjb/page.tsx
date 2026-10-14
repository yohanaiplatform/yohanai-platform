// src/app/(dashboard)/properties/[slug]/documents/ppjb/page.tsx

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PpjbEditor } from "@/components/property/PpjbEditor";
import { SetBreadcrumbLabel } from "@/components/layout/BreadcrumbLabels";
import { getListingBySlug } from "@/lib/property/getListingBySlug";
import { getListingMetadataValue } from "@/lib/property/getListings";
import { createClient } from "@/lib/supabase/server";
import { docLogoUrl, getUserBranding } from "@/lib/branding/branding";
import { parseBirthInfo, parseParty2 } from "@/lib/documents/mouTypes";
import { defaultClauses, type PpjbForm } from "@/lib/documents/ppjbTypes";

interface PpjbPageProps {
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

/** Teks tanggal lahir tersimpan ("Pontianak, 08/10/1982") -> tempat + tanggal ISO; format lain dibiarkan sebagai tempat. */
function splitBirth(info: string | null | undefined) {
  const parsed = parseBirthInfo(info ?? "");
  return { place: parsed.place, date: parsed.dateIso };
}

export default async function PpjbPage({ params, searchParams }: PpjbPageProps) {
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

  const [{ data: identity }, { data: settingsRow }, { data: profile }, { data: docs }] = await Promise.all([
    supabase.schema("property").from("owner_identities").select("birth_info, address, id_number").eq("listing_id", listing.id).maybeSingle(),
    supabase.schema("property").from("document_settings").select("data").eq("user_id", user.id).maybeSingle(),
    supabase.schema("auth_ext").from("profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle(),
    supabase
      .schema("property")
      .from("documents")
      .select("id, doc_number, created_at, data")
      .eq("listing_id", listing.id)
      .eq("doc_type", "ppjb")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const owner = getListingMetadataValue<{ name: string | null; phone: string | null }>(listing.metadata, "owner");
  const party2 = parseParty2(settingsRow?.data);
  if (!party2.agentName) party2.agentName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  const sellerBirth = splitBirth(identity?.birth_info);
  const initialForm: PpjbForm = {
    docNumberProject: party2.listingPrefix || "",
    buyer: { name: "", birthPlace: "", birthDate: "", address: "", idNumber: "", phone: "" },
    seller: {
      name: owner?.name ?? "",
      birthPlace: sellerBirth.place,
      birthDate: sellerBirth.date,
      address: identity?.address ?? "",
      idNumber: identity?.id_number ?? "",
      phone: owner?.phone ?? "",
      company: "",
    },
    property: {
      kind: "Rumah Tinggal",
      type: "",
      complexName: listing.title,
      unitNo: "",
      address: listing.address ?? "",
      shmNumber: "",
      price: String(Math.round(listing.price)),
      booking: "",
      method: "KPR",
      totalDp: "",
      facilities: "",
      paymentReceiver: "",
    },
    clauses: defaultClauses("KPR"),
    clausesEdited: false,
    footnote: "",
    signPlace: "",
    signDate: todayWib(),
    party2,
  };

  // ?doc=id memuat PPJB dari riwayat; tanpa itu mulai PPJB baru (nomor otomatis) dengan kota dan kode proyek terakhir.
  const chosen = sp.doc ? docs?.find((d) => d.id === sp.doc) : undefined;
  const lastForm = ((chosen?.data ?? docs?.[0]?.data) as { form?: Partial<PpjbForm> } | null | undefined)?.form;
  let initialNumber = "";
  if (chosen && lastForm) {
    initialForm.buyer = { ...initialForm.buyer, ...(lastForm.buyer ?? {}) };
    initialForm.seller = { ...initialForm.seller, ...(lastForm.seller ?? {}) };
    initialForm.property = { ...initialForm.property, ...(lastForm.property ?? {}) };
    initialForm.clauses = lastForm.clauses ?? initialForm.clauses;
    initialForm.clausesEdited = lastForm.clausesEdited ?? true;
    initialForm.footnote = lastForm.footnote ?? "";
    initialForm.signPlace = lastForm.signPlace ?? "";
    initialForm.signDate = lastForm.signDate || initialForm.signDate;
    initialForm.docNumberProject = lastForm.docNumberProject ?? initialForm.docNumberProject;
    initialNumber = chosen.doc_number ?? "";
  } else if (lastForm) {
    initialForm.signPlace = lastForm.signPlace ?? "";
    initialForm.docNumberProject = lastForm.docNumberProject ?? initialForm.docNumberProject;
    initialForm.property.facilities = lastForm.property?.facilities ?? "";
    initialForm.property.paymentReceiver = lastForm.property?.paymentReceiver ?? "";
    initialForm.seller.company = lastForm.seller?.company ?? "";
  }

  const history = (docs ?? []).map((d) => ({ id: d.id, docNumber: d.doc_number, createdAt: formatHistoryDate(d.created_at) }));

  return (
    <div className="space-y-6 p-6 print:p-0">
      <SetBreadcrumbLabel segment={listing.slug} label={listing.title} />
      <div className="no-print space-y-1">
        {backLink}
        <h1 className="text-2xl font-bold tracking-tight">PPJB -- Perjanjian Pengikatan Jual Beli</h1>
        <p className="text-sm text-muted-foreground">
          {listing.title}. Isi data pembeli dan penjual, pilih metode pembayaran, lalu sesuaikan klausul kesepakatan sebelum dicetak.
        </p>
      </div>
      <PpjbEditor
        logoUrl={docLogoUrl(await getUserBranding(supabase, user.id))}
        logoPosition={(await getUserBranding(supabase, user.id)).logoPosition}
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
