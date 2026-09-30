// src/lib/ai/relevantListings.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface ListingMatch {
  title: string;
  address: string | null;
  price: number | null;
  status: string | null;
  aiTags: string[];
  description: string | null;
  photoUrls: string[];
  videoUrl: string | null;
}

const MAX_PHOTOS_PER_LISTING = 3;

const MAX_RESULTS = 6;

// Deskripsi listing sering berisi detail penting yang tidak ada di field
// lain (mis. rincian DP/harga per blok, promo) -- WAJIB dikirim ke AI,
// tapi dibatasi panjangnya (bisa ratusan kata per listing, dikali sampai
// 6 listing per pesan) supaya token tidak membengkak tanpa kendali.
const MAX_DESCRIPTION_CHARS = 1500;

// Skor match tag lokasi (metadata.ai_tags) dibobot lebih tinggi dari
// title/address -- ai_tags itu sinyal yang SENGAJA diisi agen per listing
// (istilah lokal Kotabaru/Kobar/subsidi dll), jadi lebih presisi
// dibanding kata yang kebetulan nyangkut di alamat administratif umum
// (mis. "kota" nyangkut di "...Kota Pontianak" di banyak listing lain).
const TAG_MATCH_WEIGHT = 2;
const TITLE_ADDRESS_MATCH_WEIGHT = 1;

/**
 * Cari listing yang cocok dengan istilah pencarian (kata dari pesan lead +
 * related_listing_terms hasil match knowledge.entries) -- match ke
 * title/address DAN metadata.ai_tags ("Tag Lokasi / AI Info", istilah
 * lokal informal seperti "Kotabaru"/"Kobar"/"dekat Untan" yang diisi agen
 * per listing, lihat AddListingForm.tsx).
 *
 * Ambil SEMUA listing aktif dulu, cocokkan+skor di JS -- metadata.ai_tags
 * array JSONB tidak bisa di-ILIKE langsung lewat filter PostgREST biasa,
 * dan volume listing masih puluhan-ratusan jadi ini masih murah. Kalau
 * volume sudah ribuan, ganti ke full-text search/index khusus.
 *
 * Diranking (bukan cuma slice urutan DB) -- tanpa ini, kata generik yang
 * kebetulan match ke banyak listing (mis. "kota") bisa menyingkirkan
 * listing yang justru match presisi lewat ai_tags dari 6 slot MAX_RESULTS.
 * Ketemu nyata 30 Sep 2026: listing bertag "subsidi, Kotabaru, Kobar"
 * malah tidak ke-include saat lead tanya "subsidi di kota baru", padahal
 * cuma kalah "voting" dari listing lain yang alamatnya kebetulan
 * mengandung "Kota Pontianak".
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
    .select("title, address, price, metadata, description")
    .is("deleted_at", null);

  if (!data) return [];

  const scored = data
    .map((listing) => {
      const metadata = (listing.metadata ?? {}) as Record<string, unknown>;
      if (metadata.hidden === true || metadata.hidden === "true") return null;

      const aiTags = Array.isArray(metadata.ai_tags) ? (metadata.ai_tags as unknown[]).map(String) : [];
      const tagsText = aiTags.join(" ").toLowerCase();
      const titleAddressText = [listing.title, listing.address ?? ""].join(" ").toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (tagsText.includes(term)) score += TAG_MATCH_WEIGHT;
        else if (titleAddressText.includes(term)) score += TITLE_ADDRESS_MATCH_WEIGHT;
      }
      if (score === 0) return null;

      return { listing, metadata, aiTags, score };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  return scored.map(({ listing, metadata, aiTags }) => {
    const photoUrls = Array.isArray(metadata.photo_urls)
      ? (metadata.photo_urls as unknown[]).map(String).slice(0, MAX_PHOTOS_PER_LISTING)
      : [];

    // Buang tag bookkeeping migrasi ("[Migrasi dari spreadsheet, GDI/2026/xx]")
    // -- itu internal, bukan sesuatu yang perlu/boleh dibaca AI Agent.
    const cleanedDescription = listing.description?.replace(/\[Migrasi dari spreadsheet,[^\]]*\]/g, "").trim() || null;
    const description =
      cleanedDescription && cleanedDescription.length > MAX_DESCRIPTION_CHARS
        ? `${cleanedDescription.slice(0, MAX_DESCRIPTION_CHARS)}...`
        : cleanedDescription;

    return {
      title: listing.title,
      address: listing.address,
      price: listing.price === null ? null : Number(listing.price),
      status: (metadata.status as string | undefined) ?? null,
      aiTags,
      description,
      photoUrls,
      videoUrl: (metadata.video_url as string | undefined) || null,
    };
  });
}
