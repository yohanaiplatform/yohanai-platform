// src/app/(dashboard)/properties/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PropertyEditableFields } from "@/components/property/PropertyEditableFields";
import { PropertyConfidentialFields } from "@/components/property/PropertyConfidentialFields";
import { PropertyMainFieldsEditable } from "@/components/property/PropertyMainFieldsEditable";
import { PropertyVisibilityToggle } from "@/components/property/PropertyVisibilityToggle";
import { PropertyAssignSelect } from "@/components/property/PropertyAssignSelect";
import { PropertyPhotoManager } from "@/components/property/PropertyPhotoManager";
import { PropertyGeoCard } from "@/components/property/PropertyGeoCard";
import { KprSimulator } from "@/components/property/KprSimulator";
import { isSubsidiListing } from "@/lib/kpr/calculator";
import { PropertyVideoEditable } from "@/components/property/PropertyVideoEditable";
import { PropertyExportButtons } from "@/components/property/PropertyExportButtons";
import { Button } from "@/components/ui/button";
import { SetBreadcrumbLabel } from "@/components/layout/BreadcrumbLabels";
import { getListingBySlug } from "@/lib/property/getListingBySlug";
import { getListingMetadataValue } from "@/lib/property/getListings";
import { createClient } from "@/lib/supabase/server";

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: listing, error } = await getListingBySlug(supabase, slug);

  const backLink = (
    <Link
      href="/properties"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Kembali ke daftar listing
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

  const status = getListingMetadataValue<string>(listing.metadata, "status");
  const bedrooms = getListingMetadataValue<number>(listing.metadata, "bedrooms");
  const bathrooms = getListingMetadataValue<number>(listing.metadata, "bathrooms");
  const landArea = getListingMetadataValue<number>(listing.metadata, "land_area");
  const buildingArea = getListingMetadataValue<number>(listing.metadata, "building_area");
  const carport = getListingMetadataValue<number>(listing.metadata, "carport");
  const certificateType = getListingMetadataValue<string>(listing.metadata, "certificate_type");
  const videoUrl = getListingMetadataValue<string>(listing.metadata, "video_url");
  const contactPhone = getListingMetadataValue<string>(listing.metadata, "contact_phone");
  const mapsUrl = getListingMetadataValue<string>(listing.metadata, "maps_url");
  const geo = getListingMetadataValue<{ lat: number; lng: number; updatedAt?: string; nearby?: { category: string; name: string; distanceM: number }[] }>(
    listing.metadata,
    "geo"
  );
  const aiTags = getListingMetadataValue<string[]>(listing.metadata, "ai_tags") ?? [];
  const photoUrls = getListingMetadataValue<string[]>(listing.metadata, "photo_urls") ?? [];
  const hidden = getListingMetadataValue<boolean>(listing.metadata, "hidden") ?? false;
  const owner = getListingMetadataValue<{ name: string | null; phone: string | null }>(
    listing.metadata,
    "owner"
  );
  const commission = getListingMetadataValue<{
    type: "percentage" | "fixed" | null;
    value: number | null;
  }>(listing.metadata, "commission");

  return (
    <div className="space-y-6 p-6">
      <SetBreadcrumbLabel segment={listing.slug} label={listing.title} />
      {backLink}

      {hidden && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <strong>Listing ini disembunyikan.</strong> Tidak muncul di daftar `/properties` dan tidak boleh
          direferensikan ke lead/konsumen (termasuk oleh AI Agent nanti) sampai ditampilkan kembali.
        </div>
      )}

      <SectionCard
        title={listing.title}
        description={listing.category_name ?? undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/properties/${listing.slug}/report`}>
              <Button type="button" variant="outline" size="sm">
                Laporan Pemasaran
              </Button>
            </Link>
            <PropertyExportButtons
              filenameBase={listing.slug}
              data={{
                title: listing.title,
                price: listing.price,
                address: listing.address,
                photoUrls,
                bedrooms,
                bathrooms,
                landArea,
                buildingArea,
                carport,
                certificateType,
                contactPhone,
                status,
              }}
            />
          </div>
        }
      >
        <div className="space-y-5">
          <PropertyMainFieldsEditable
            listingId={listing.id}
            title={listing.title}
            price={listing.price}
            address={listing.address}
            description={listing.description}
            metadata={listing.metadata}
            photoUrls={photoUrls}
          />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ditugaskan ke</span>
              <PropertyAssignSelect listingId={listing.id} assignedTo={listing.assigned_to} />
            </div>
            <PropertyVisibilityToggle listingId={listing.id} metadata={listing.metadata} hidden={hidden} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Foto" description="Foto pertama dipakai sebagai foto sampul.">
        <PropertyPhotoManager listingId={listing.id} metadata={listing.metadata} photoUrls={photoUrls} />
      </SectionCard>

      <SectionCard title="Video">
        <PropertyVideoEditable listingId={listing.id} metadata={listing.metadata} videoUrl={videoUrl ?? null} />
      </SectionCard>

      <SectionCard title="Spesifikasi">
        <PropertyEditableFields
          listingId={listing.id}
          metadata={listing.metadata}
          status={status}
          bedrooms={bedrooms}
          bathrooms={bathrooms}
          landArea={landArea}
          buildingArea={buildingArea}
          carport={carport}
          certificateType={certificateType}
          contactPhone={contactPhone}
          mapsUrl={mapsUrl}
          aiTags={aiTags}
        />
      </SectionCard>

      <SectionCard title="Lokasi & Fasilitas Sekitar" description="Titik peta dari Link Google Maps. Dibaca asisten untuk menjawab jarak dan fasilitas umum di sekitar.">
        <PropertyGeoCard listingId={listing.id} mapsUrl={mapsUrl ?? null} geo={geo ?? null} />
      </SectionCard>

      {listing.price ? (
        <SectionCard title="Simulasi KPR" description="Hitung perkiraan angsuran sesuai DP -- sama dengan hitungan yang dipakai asisten otomatis.">
          <KprSimulator
            price={listing.price}
            subsidi={isSubsidiListing({ aiTags, title: listing.title, description: listing.description })}
          />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Data Pemilik & Komisi"
        description="Rahasia -- hanya admin dan agent yang ditugaskan yang bisa lihat, tidak pernah dikirim ke flyer/export."
      >
        <PropertyConfidentialFields
          listingId={listing.id}
          metadata={listing.metadata}
          owner={owner}
          commission={commission}
        />
      </SectionCard>
    </div>
  );
}
