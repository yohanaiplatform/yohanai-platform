// src/lib/property/getListings.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export const LISTINGS_PAGE_SIZE = 24;
export const LISTING_PAGE_SIZE_OPTIONS = [24, 48, 96] as const;

export interface ListingListItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  address: string | null;
  category_id: string | null;
  category_name: string | null;
  metadata: Json;
  created_at: string;
}

export interface ListingFilters {
  status?: string;
  categoryId?: string;
  /** Cari di judul atau alamat (substring). */
  search?: string;
}

export interface GetListingsResult {
  data: ListingListItem[] | null;
  count: number;
  error: boolean;
}

function buildFilteredListingsQuery(
  supabase: SupabaseClient<Database>,
  filters: ListingFilters
) {
  let query = supabase
    .schema("property")
    .from("listings")
    .select("id, slug, title, price, address, category_id, metadata, created_at", {
      count: "exact",
    })
    .is("deleted_at", null);

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.status) {
    query = query.eq("metadata->>status", filters.status);
  }
  if (filters.search) {
    const pattern = `%${filters.search.trim().replace(/[%,()]/g, "")}%`;
    query = query.or(`title.ilike.${pattern},address.ilike.${pattern}`);
  }

  return query;
}

export async function getListings(
  supabase: SupabaseClient<Database>,
  page: number = 1,
  filters: ListingFilters = {},
  pageSize: number = LISTINGS_PAGE_SIZE
): Promise<GetListingsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: listings, count, error } = await buildFilteredListingsQuery(supabase, filters)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { data: null, count: 0, error: true };
  }

  const categoryIds = [...new Set(listings.map((l) => l.category_id).filter(Boolean))] as string[];
  let categoryNameById = new Map<string, string>();

  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .schema("property")
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);
    categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));
  }

  return {
    data: listings.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      price: Number(l.price),
      address: l.address,
      category_id: l.category_id,
      category_name: l.category_id ? (categoryNameById.get(l.category_id) ?? null) : null,
      metadata: l.metadata,
      created_at: l.created_at,
    })),
    count: count ?? 0,
    error: false,
  };
}

export function getListingMetadataValue<T = string>(metadata: Json, key: string): T | null {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, Json | undefined>)[key];
  return value === undefined || value === null ? null : (value as T);
}
