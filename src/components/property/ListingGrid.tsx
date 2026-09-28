// src/components/property/ListingGrid.tsx

import Link from "next/link";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PropertyStatusBadge } from "@/components/property/property-status-badge";
import { formatRupiah } from "@/lib/property/formatRupiah";
import { getListingMetadataValue, type ListingListItem } from "@/lib/property/getListings";

interface ListingGridProps {
  data: ListingListItem[] | null;
  error: boolean;
}

export function ListingGrid({ data, error }: ListingGridProps) {
  if (error) {
    return (
      <EmptyState
        title="Error"
        description="Gagal memuat data listing. Coba muat ulang halaman."
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Listing"
        description={'Tambahkan listing pertama lewat tombol "+ Tambah Listing".'}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((listing) => {
        const status = getListingMetadataValue<string>(listing.metadata, "status");
        const hidden = getListingMetadataValue<boolean>(listing.metadata, "hidden") ?? false;
        const photoUrls = getListingMetadataValue<string[]>(listing.metadata, "photo_urls");
        const coverPhoto = photoUrls?.[0];

        return (
          <Link
            key={listing.id}
            href={`/properties/${listing.slug}`}
            className={`overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:border-foreground/20 ${hidden ? "opacity-60" : ""}`}
          >
            <div className="relative flex h-40 items-center justify-center bg-muted">
              {coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPhoto} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
              {hidden && (
                <span className="absolute left-2 top-2 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Disembunyikan
                </span>
              )}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-snug">{listing.title}</p>
                <PropertyStatusBadge status={status} />
              </div>
              <p className="text-sm font-semibold text-brand">{formatRupiah(listing.price)}</p>
              {listing.address && (
                <p className="text-xs text-muted-foreground line-clamp-1">{listing.address}</p>
              )}
              {listing.category_name && (
                <p className="text-xs text-muted-foreground">{listing.category_name}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
