// src/lib/ai/relevantListings.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { formatAiInfoForPrompt, parseAiInfo } from "@/lib/property/aiInfo";

export interface ListingMatch {
  title: string;
  address: string | null;
  price: number | null;
  status: string | null;
  aiTags: string[];
  description: string | null;
  photoUrls: string[];
  videoUrl: string | null;
  /** Info resmi dari agen (metadata.ai_info) sudah diformat per baris, null kalau kosong. */
  aiInfo: string | null;
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
/** Bobot tambahan untuk sinyal yang lebih presisi dari sekadar kata tunggal. */
const PHRASE_MATCH_WEIGHT = 3;
const TYPE_MATCH_WEIGHT = 6;
const TYPE_MISMATCH_PENALTY = 6;
const PRIMARY_TERM_BONUS = 1;

const norm = (s: string) => s.toLowerCase().replace(/\btipe\b/g, "type");
const compact = (s: string) => norm(s).replace(/[^a-z0-9]/g, "");

/** Nomor tipe rumah yang disebut ("tipe 45" / "type45") -- pesan baru didahulukan, lalu riwayat (yang terakhir disebut). */
function extractTypeNumber(primaryText: string, contextText: string): string | null {
  const re = /\b(?:tipe|type)\s*(\d{2,3})\b/gi;
  const primary = [...primaryText.matchAll(re)];
  if (primary.length) return primary[primary.length - 1][1];
  const ctx = [...contextText.matchAll(re)];
  return ctx.length ? ctx[ctx.length - 1][1] : null;
}

/** Pasangan kata berurutan ("tanjung raya", "jl pemda") -- penanda lokasi/nama yang lebih spesifik dari kata tunggal. */
function extractPhrases(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const out = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length >= 3 && words[i + 1].length >= 2) out.add(`${words[i]} ${words[i + 1]}`);
  }
  return [...out];
}

export interface FindListingsOptions {
  /** Teks pesan BARU lead -- istilah dari sini diberi bonus dibanding istilah dari riwayat. */
  primaryText?: string;
  /** Teks riwayat percakapan terakhir (untuk nomor tipe & frasa lokasi yang disebut sebelumnya). */
  contextText?: string;
}

export async function findRelevantListings(
  supabaseAdmin: SupabaseClient<Database>,
  searchTerms: string[],
  options: FindListingsOptions = {}
): Promise<ListingMatch[]> {
  const terms = [...new Set(searchTerms.map((t) => t.toLowerCase().trim()).filter((t) => t.length >= 3))];
  if (terms.length === 0) return [];

  const primaryText = options.primaryText ?? "";
  const contextText = options.contextText ?? "";
  const primaryTerms = new Set(
    primaryText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );
  const typeNumber = extractTypeNumber(primaryText, contextText);
  const phrases = extractPhrases(`${primaryText} ${contextText}`);

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

      const tagsCompact = compact(aiTags.join(" "));
      const titleAddressCompact = compact(titleAddressText);

      let score = 0;
      for (const term of terms) {
        const t = compact(term);
        const bonus = primaryTerms.has(term) ? PRIMARY_TERM_BONUS : 0;
        // Cocok juga tanpa spasi/tanda baca ("kota baru" = "kotabaru", "diserdam" = "di serdam" di tag).
        if (tagsText.includes(term) || (t.length >= 4 && tagsCompact.includes(t))) score += TAG_MATCH_WEIGHT + bonus;
        else if (titleAddressText.includes(term) || (t.length >= 4 && titleAddressCompact.includes(t))) score += TITLE_ADDRESS_MATCH_WEIGHT + bonus;
      }

      // Frasa berurutan ("tanjung raya", "jl pemda") cocok -> sinyal lokasi/nama yang spesifik.
      for (const phrase of phrases) {
        const p = compact(phrase);
        if (p.length >= 6 && (titleAddressCompact.includes(p) || tagsCompact.includes(p))) score += PHRASE_MATCH_WEIGHT;
      }

      // Tipe rumah yang disebut lead ("tipe 45"): listing bertipe sama diutamakan, bertipe lain dikurangi,
      // supaya foto/video/harga tidak tertukar antar listing di kawasan yang sama.
      if (typeNumber) {
        const titleNorm = norm(listing.title);
        const listingType = titleNorm.match(/\btype\s*(\d{2,3})\b/)?.[1];
        if (listingType === typeNumber) score += TYPE_MATCH_WEIGHT;
        else if (listingType) score -= TYPE_MISMATCH_PENALTY;
      }
      // Lead minta video: kalau ada listing kembar (tipe/lokasi/harga sama), yang punya video didahulukan.
      if (score > 0 && /vid(e|i)o/i.test(primaryText) && metadata.video_url) score += 2;
      if (score <= 0) return null;

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
      aiInfo: formatAiInfoForPrompt(parseAiInfo(metadata)),
    };
  });
}
