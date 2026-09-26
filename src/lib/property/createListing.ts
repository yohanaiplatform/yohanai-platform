// src/lib/property/createListing.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface CreateListingInput {
  title: string;
  categoryId?: string;
  price: number;
  address?: string;
  description?: string;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  landArea?: number;
  buildingArea?: number;
  carport?: number;
  certificateType?: string;
  videoUrl?: string;
}

export interface CreateListingResult {
  listingId: string | null;
  error: string | null;
}

/** Insert listing dasar (tanpa foto) -- foto diupload & ditambahkan ke metadata setelah listing punya id. */
export async function createListing(
  supabase: SupabaseClient<Database>,
  input: CreateListingInput
): Promise<CreateListingResult> {
  const { data: userData } = await supabase.auth.getUser();

  const { data: inserted, error } = await supabase
    .schema("property")
    .from("listings")
    .insert({
      category_id: input.categoryId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      address: input.address?.trim() || null,
      price: input.price,
      created_by: userData.user?.id ?? null,
      metadata: {
        status: input.status,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        land_area: input.landArea ?? null,
        building_area: input.buildingArea ?? null,
        carport: input.carport ?? null,
        certificate_type: input.certificateType || null,
        video_url: input.videoUrl?.trim() || null,
        photo_urls: [],
      },
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { listingId: null, error: error?.message ?? "Insert gagal" };
  }

  return { listingId: inserted.id, error: null };
}
