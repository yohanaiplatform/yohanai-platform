// src/app/(dashboard)/properties/page.tsx

import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { ListingListFilters } from "@/components/property/ListingListFilters";
import { ListingListPagination } from "@/components/property/ListingListPagination";
import { ListingPageSizeSelect } from "@/components/property/ListingPageSizeSelect";
import { ListingGrid } from "@/components/property/ListingGrid";
import {
  getListings,
  LISTINGS_PAGE_SIZE,
  LISTING_PAGE_SIZE_OPTIONS,
  type ListingFilters,
} from "@/lib/property/getListings";
import { getCategories } from "@/lib/property/categories";
import { createClient } from "@/lib/supabase/server";

interface PropertiesPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    categoryId?: string;
    search?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const requestedPageSize = Number(params.pageSize);
  const pageSize = (LISTING_PAGE_SIZE_OPTIONS as readonly number[]).includes(requestedPageSize)
    ? requestedPageSize
    : LISTINGS_PAGE_SIZE;

  const filters: ListingFilters = {
    status: params.status || undefined,
    categoryId: params.categoryId || undefined,
    search: params.search || undefined,
  };

  const supabase = await createClient();

  const [{ data: listings, count, error }, { data: categories }] = await Promise.all([
    getListings(supabase, page, filters, pageSize),
    getCategories(supabase),
  ]);

  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="Property"
        description="Kelola listing properti."
        action={
          <div className="flex items-center gap-2">
            <Link href="/properties/categories">
              <Button size="sm" variant="outline">
                Kelola Kategori
              </Button>
            </Link>
            <Link href="/properties/new">
              <Button size="sm">+ Tambah Listing</Button>
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          <ListingListFilters
            categories={categories ?? []}
            status={params.status}
            categoryId={params.categoryId}
            search={params.search}
            pageSize={pageSize}
          />
          <div className="flex justify-end">
            <ListingPageSizeSelect pageSize={pageSize} />
          </div>
          <ListingGrid data={listings} error={error} />
          {!error && (
            <ListingListPagination page={page} pageSize={pageSize} totalCount={count} filters={filters} />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
