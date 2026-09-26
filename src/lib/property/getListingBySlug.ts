// src/lib/property/getListingBySlug.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface ListingDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  address: string | null;
  price: number;
  category_id: string | null;
  category_name: string | null;
  assigned_to: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface GetListingBySlugResult {
  data: ListingDetail | null;
  error: boolean;
}

export async function getListingBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<GetListingBySlugResult> {
  const { data: listing, error } = await supabase
    .schema("property")
    .from("listings")
    .select(
      "id, slug, title, description, address, price, category_id, assigned_to, metadata, created_at, updated_at"
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return { data: null, error: true };
  }
  if (!listing) {
    return { data: null, error: false };
  }

  let category_name: string | null = null;
  if (listing.category_id) {
    const { data: category } = await supabase
      .schema("property")
      .from("categories")
      .select("name")
      .eq("id", listing.category_id)
      .maybeSingle();
    category_name = category?.name ?? null;
  }

  return {
    data: {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      description: listing.description,
      address: listing.address,
      price: Number(listing.price),
      category_id: listing.category_id,
      category_name,
      assigned_to: listing.assigned_to,
      metadata: listing.metadata,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
    },
    error: false,
  };
}
