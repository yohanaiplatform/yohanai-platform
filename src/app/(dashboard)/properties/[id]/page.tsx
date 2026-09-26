// src/app/(dashboard)/properties/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PropertyEditableFields } from "@/components/property/PropertyEditableFields";
import { PropertyPhotoManager } from "@/components/property/PropertyPhotoManager";
import { PropertyVideoEmbed } from "@/components/property/PropertyVideoEmbed";
import { PropertyExportButtons } from "@/components/property/PropertyExportButtons";
import { getListingById } from "@/lib/property/getListingById";
import { getListingMetadataValue } from "@/lib/property/getListings";
import { formatRupiah } from "@/lib/property/formatRupiah";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: listing, error } = await getListingById(supabase, id);

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
  const photoUrls = getListingMetadataValue<string[]>(listing.metadata, "photo_urls") ?? [];

  return (
    <div className="space-y-6 p-6">
      {backLink}

      <SectionCard
        title={listing.title}
        description={listing.category_name ?? undefined}
        action={
          <PropertyExportButtons
            filenameBase={listing.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}
            data={{
              title: listing.title,
              price: listing.price,
              address: listing.address,
              coverPhoto: photoUrls[0] ?? null,
              bedrooms,
              bathrooms,
              landArea,
              buildingArea,
            }}
          />
        }
      >
        <div className="space-y-5">
          <p className="text-2xl font-semibold text-brand">{formatRupiah(listing.price)}</p>
          {listing.address && <p className="text-sm text-muted-foreground">{listing.address}</p>}
          {listing.description && <p className="whitespace-pre-wrap text-sm">{listing.description}</p>}
        </div>
      </SectionCard>

      <SectionCard title="Foto" description="Foto pertama dipakai sebagai foto sampul.">
        <PropertyPhotoManager listingId={listing.id} metadata={listing.metadata} photoUrls={photoUrls} />
      </SectionCard>

      {videoUrl && (
        <SectionCard title="Video">
          <PropertyVideoEmbed url={videoUrl} />
        </SectionCard>
      )}

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
        />
      </SectionCard>
    </div>
  );
}
