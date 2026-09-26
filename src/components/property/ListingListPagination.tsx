// src/components/property/ListingListPagination.tsx

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ListingFilters } from "@/lib/property/getListings";

interface ListingListPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  filters: ListingFilters;
}

function buildHref(page: number, filters: ListingFilters, pageSize: number): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.status) params.set("status", filters.status);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.search) params.set("search", filters.search);
  return `/properties?${params.toString()}`;
}

export function ListingListPagination({
  page,
  pageSize,
  totalCount,
  filters,
}: ListingListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Halaman {page} dari {totalPages} &middot; {totalCount} listing
      </p>
      <div className="flex gap-2">
        <Link
          href={buildHref(page - 1, filters, pageSize)}
          aria-disabled={!hasPrev}
          tabIndex={hasPrev ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !hasPrev && "pointer-events-none opacity-50"
          )}
        >
          Sebelumnya
        </Link>
        <Link
          href={buildHref(page + 1, filters, pageSize)}
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !hasNext && "pointer-events-none opacity-50"
          )}
        >
          Berikutnya
        </Link>
      </div>
    </div>
  );
}
