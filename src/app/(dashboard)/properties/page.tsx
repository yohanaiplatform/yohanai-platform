// src/app/(dashboard)/properties/page.tsx

import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { ListingListFilters } from "@/components/property/ListingListFilters";
import { ListingGrid } from "@/components/property/ListingGrid";
import { getListings } from "@/lib/property/getListings";
import { getCategories } from "@/lib/property/categories";
import { createClient } from "@/lib/supabase/server";

interface PropertiesPageProps {
  searchParams: Promise<{
    status?: string;
    categoryId?: string;
    search?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: listings, error }, { data: categories }] = await Promise.all([
    getListings(supabase, {
      status: params.status || undefined,
      categoryId: params.categoryId || undefined,
      search: params.search || undefined,
    }),
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
          />
          <ListingGrid data={listings} error={error} />
        </div>
      </SectionCard>
    </div>
  );
}
