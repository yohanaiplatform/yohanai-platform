// src/lib/property/getListings.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface ListingListItem {
  id: string;
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
  error: boolean;
}

/**
 * Belum ada pagination (Fase 1, volume masih kecil) -- diambil semua
 * sekaligus, urut listing terbaru dulu. Bisa ditambah nanti seperti pola
 * LEADS_PAGE_SIZE di getLeads.ts kalau jumlah listing sudah banyak.
 */
export async function getListings(
  supabase: SupabaseClient<Database>,
  filters: ListingFilters = {}
): Promise<GetListingsResult> {
  let query = supabase
    .schema("property")
    .from("listings")
    .select("id, title, price, address, category_id, metadata, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

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

  const { data: listings, error } = await query;

  if (error) {
    return { data: null, error: true };
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
      title: l.title,
      price: Number(l.price),
      address: l.address,
      category_id: l.category_id,
      category_name: l.category_id ? (categoryNameById.get(l.category_id) ?? null) : null,
      metadata: l.metadata,
      created_at: l.created_at,
    })),
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
