// src/lib/ai/relevantListings.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface ListingMatch {
  title: string;
  address: string | null;
  price: number | null;
  status: string | null;
}

const MAX_RESULTS = 6;

// PostgREST .or() memperlakukan koma/kurung sebagai pemisah sintaks --
// buang karakter itu dari istilah pencarian supaya tidak merusak query.
function sanitizeTerm(term: string): string {
  return term.replace(/[(),%]/g, "").trim();
}

/**
 * Cari listing yang cocok dengan istilah pencarian (dari kata di pesan lead
 * + related_listing_terms hasil match knowledge.entries) -- match sederhana
 * ILIKE ke title/address, bukan semantic search. Listing dengan
 * metadata.hidden = true SENGAJA dikecualikan (aturan yang sudah dicatat di
 * docs/modules/property.mdx sejak fitur Sembunyikan Listing dibuat).
 */
export async function findRelevantListings(
  supabaseAdmin: SupabaseClient<Database>,
  searchTerms: string[]
): Promise<ListingMatch[]> {
  const terms = [...new Set(searchTerms.map(sanitizeTerm).filter((t) => t.length >= 3))];
  if (terms.length === 0) return [];

  const orFilter = terms.map((t) => `title.ilike.%${t}%,address.ilike.%${t}%`).join(",");

  const { data } = await supabaseAdmin
    .schema("property")
    .from("listings")
    .select("title, address, price, metadata")
    .is("deleted_at", null)
    .or(orFilter)
    .order("updated_at", { ascending: false })
    .limit(MAX_RESULTS * 2); // ambil lebih banyak dulu, filter hidden di JS baru batasi

  if (!data) return [];

  return data
    .filter((listing) => {
      const metadata = (listing.metadata ?? {}) as Record<string, unknown>;
      return metadata.hidden !== true && metadata.hidden !== "true";
    })
    .slice(0, MAX_RESULTS)
    .map((listing) => ({
      title: listing.title,
      address: listing.address,
      price: listing.price === null ? null : Number(listing.price),
      status: ((listing.metadata ?? {}) as Record<string, unknown>).status as string | undefined ?? null,
    }));
}
