// src/lib/ai/relevantListings.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface ListingMatch {
  title: string;
  address: string | null;
  price: number | null;
  status: string | null;
  photoUrls: string[];
  videoUrl: string | null;
}

const MAX_PHOTOS_PER_LISTING = 3;

const MAX_RESULTS = 6;

/**
 * Cari listing yang cocok dengan istilah pencarian (kata dari pesan lead +
 * related_listing_terms hasil match knowledge.entries) -- match ke
 * title/address DAN metadata.ai_tags ("Tag Lokasi / AI Info", istilah
 * lokal informal seperti "Kotabaru"/"Kobar"/"dekat Untan" yang diisi agen
 * per listing, lihat AddListingForm.tsx).
 *
 * Ambil SEMUA listing aktif dulu, cocokkan di JS -- metadata.ai_tags array
 * JSONB tidak bisa di-ILIKE langsung lewat filter PostgREST biasa, dan
 * volume listing masih puluhan-ratusan jadi ini masih murah. Kalau volume
 * sudah ribuan, ganti ke full-text search/index khusus.
 *
 * Listing dengan metadata.hidden = true SENGAJA dikecualikan (aturan yang
 * sudah dicatat sejak fitur Sembunyikan Listing dibuat).
 */
export async function findRelevantListings(
  supabaseAdmin: SupabaseClient<Database>,
  searchTerms: string[]
): Promise<ListingMatch[]> {
  const terms = [...new Set(searchTerms.map((t) => t.toLowerCase().trim()).filter((t) => t.length >= 3))];
  if (terms.length === 0) return [];

  const { data } = await supabaseAdmin
    .schema("property")
    .from("listings")
    .select("title, address, price, metadata")
    .is("deleted_at", null);

  if (!data) return [];

  const matches = data.filter((listing) => {
    const metadata = (listing.metadata ?? {}) as Record<string, unknown>;
    if (metadata.hidden === true || metadata.hidden === "true") return false;

    const aiTags = Array.isArray(metadata.ai_tags) ? (metadata.ai_tags as unknown[]).map(String) : [];
    const haystack = [listing.title, listing.address ?? "", ...aiTags].join(" ").toLowerCase();

    return terms.some((term) => haystack.includes(term));
  });

  return matches.slice(0, MAX_RESULTS).map((listing) => {
    const metadata = (listing.metadata ?? {}) as Record<string, unknown>;
    const photoUrls = Array.isArray(metadata.photo_urls)
      ? (metadata.photo_urls as unknown[]).map(String).slice(0, MAX_PHOTOS_PER_LISTING)
      : [];
    return {
      title: listing.title,
      address: listing.address,
      price: listing.price === null ? null : Number(listing.price),
      status: (metadata.status as string | undefined) ?? null,
      photoUrls,
      videoUrl: (metadata.video_url as string | undefined) || null,
    };
  });
}
