// src/lib/property/createListing.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { generateUniqueListingSlug } from "@/lib/property/slugify";

export interface CreateListingInput {
  title: string;
  categoryId?: string;
  /** Wajib -- RLS listings_owner_or_admin menolak insert kalau bukan diri sendiri (non-admin) atau tidak diisi. */
  assignedTo: string;
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
  contactPhone?: string;
}

export interface CreateListingResult {
  listingId: string | null;
  slug: string | null;
  error: string | null;
}

/** Insert listing dasar (tanpa foto) -- foto diupload & ditambahkan ke metadata setelah listing punya id. */
export async function createListing(
  supabase: SupabaseClient<Database>,
  input: CreateListingInput
): Promise<CreateListingResult> {
  const [{ data: userData }, slug] = await Promise.all([
    supabase.auth.getUser(),
    generateUniqueListingSlug(supabase, input.title),
  ]);

  const { data: inserted, error } = await supabase
    .schema("property")
    .from("listings")
    .insert({
      category_id: input.categoryId || null,
      assigned_to: input.assignedTo,
      title: input.title.trim(),
      slug,
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
        contact_phone: input.contactPhone?.trim() || null,
        photo_urls: [],
      },
    })
    .select("id, slug")
    .single();

  if (error || !inserted) {
    return { listingId: null, slug: null, error: error?.message ?? "Insert gagal" };
  }

  return { listingId: inserted.id, slug: inserted.slug, error: null };
}
