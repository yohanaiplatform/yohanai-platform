// src/app/(dashboard)/properties/[slug]/documents/mou/page.tsx

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MouDocumentEditor } from "@/components/property/MouDocumentEditor";
import { SetBreadcrumbLabel } from "@/components/layout/BreadcrumbLabels";
import { getListingBySlug } from "@/lib/property/getListingBySlug";
import { getListingMetadataValue } from "@/lib/property/getListings";
import { createClient } from "@/lib/supabase/server";
import { docLogoUrl, getUserBranding } from "@/lib/branding/branding";
import { parseParty2, type MouForm, type MouListingInfo } from "@/lib/documents/mouTypes";

interface MouPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ doc?: string }>;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function todayWib(): string {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

function formatHistoryDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso));
}

export default async function MouPage({ params, searchParams }: MouPageProps) {
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

  const [{ data: codeRow }, { data: identity }, { data: settingsRow }, { data: profile }, { data: docs }] = await Promise.all([
    supabase.schema("property").from("listings").select("listing_code").eq("id", listing.id).maybeSingle(),
    supabase.schema("property").from("owner_identities").select("birth_info, address, occupation, id_number, id_photo").eq("listing_id", listing.id).maybeSingle(),
    supabase.schema("property").from("document_settings").select("data").eq("user_id", user.id).maybeSingle(),
    supabase.schema("auth_ext").from("profiles").select("first_name, last_name, brand_name").eq("user_id", user.id).maybeSingle(),
    supabase
      .schema("property")
      .from("documents")
      .select("id, doc_number, created_at, data")
      .eq("listing_id", listing.id)
      .eq("doc_type", "mou_pemasaran")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const owner = getListingMetadataValue<{ name: string | null; phone: string | null }>(listing.metadata, "owner");
  const commission = getListingMetadataValue<{ type: "percentage" | "fixed" | null; value: number | null }>(listing.metadata, "commission");

  const listingInfo: MouListingInfo = {
    title: listing.title,
    landArea: getListingMetadataValue<number>(listing.metadata, "land_area") ?? null,
    buildingArea: getListingMetadataValue<number>(listing.metadata, "building_area") ?? null,
    bedrooms: getListingMetadataValue<number>(listing.metadata, "bedrooms") ?? null,
    bathrooms: getListingMetadataValue<number>(listing.metadata, "bathrooms") ?? null,
    carport: getListingMetadataValue<number>(listing.metadata, "carport") ?? null,
    photoUrls: (getListingMetadataValue<string[]>(listing.metadata, "photo_urls") ?? []).slice(0, 4),
  };

  const party2 = parseParty2(settingsRow?.data);
  if (!party2.agentName) {
    party2.agentName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  }

  const initialForm: MouForm = {
    owner: {
      name: owner?.name ?? "",
      phone: owner?.phone ?? "",
      birthInfo: identity?.birth_info ?? "",
      address: identity?.address ?? "",
      occupation: identity?.occupation ?? "",
      idNumber: identity?.id_number ?? "",
      idPhoto: identity?.id_photo ?? "",
    },
    party2,
    property: {
      type: listing.category_name ?? "Rumah",
      units: "1",
      offer: "Dijual",
      location: listing.address ?? "",
      certificate: getListingMetadataValue<string>(listing.metadata, "certificate_type") ?? "",
      certificateNumber: "",
      description: "",
      price: String(Math.round(listing.price)),
      commissionPct: commission?.type === "percentage" && commission.value ? String(commission.value) : "",
      commissionNominal: commission?.type === "fixed" && commission.value ? String(commission.value) : "",
      closingFee: "",
    },
    agreement: {
      kind: "NON-EKSKLUSIF",
      months: "12",
      signPlace: "",
      signDate: todayWib(),
      banner: "YA",
      documents: "KTP, Copy Sertifikat",
      extraInfo: "",
    },
  };

  // Buka dokumen dari riwayat (?doc=id) atau lanjutkan dari dokumen terakhir untuk listing ini.
  const chosen = (sp.doc ? docs?.find((d) => d.id === sp.doc) : undefined) ?? docs?.[0];
  const saved = chosen?.data as { form?: Partial<MouForm> } | null | undefined;
  if (saved?.form) {
    const f = saved.form;
    // Foto KTP selalu dari identitas pemilik terbaru (tidak ikut snapshot).
    initialForm.owner = { ...initialForm.owner, ...(f.owner ?? {}), idPhoto: initialForm.owner.idPhoto };
    initialForm.property = { ...initialForm.property, ...(f.property ?? {}) };
    initialForm.agreement = { ...initialForm.agreement, ...(f.agreement ?? {}) };
    // Pihak 2 selalu memakai isian tetap terbaru milik pengguna bila ada; selain itu pakai dari dokumen.
    if (!settingsRow?.data && f.party2) initialForm.party2 = parseParty2(f.party2);
  }

  const history = (docs ?? []).map((d) => ({ id: d.id, docNumber: d.doc_number, createdAt: formatHistoryDate(d.created_at) }));

  return (
    <div className="space-y-6 p-6 print:p-0">
      <SetBreadcrumbLabel segment={listing.slug} label={listing.title} />
      <div className="no-print space-y-1">
        {backLink}
        <h1 className="text-2xl font-bold tracking-tight">MoU Pemasaran</h1>
        <p className="text-sm text-muted-foreground">
          {listing.title}. Isian diambil dari data listing; lengkapi yang kurang, simpan, lalu cetak atau simpan sebagai PDF.
        </p>
      </div>
      <MouDocumentEditor
        logoUrl={docLogoUrl(await getUserBranding(supabase, user.id))}
        listingId={listing.id}
        slug={listing.slug}
        initialForm={initialForm}
        listing={listingInfo}
        initialCode={codeRow?.listing_code ?? ""}
        history={history}
      />
    </div>
  );
}
