// src/lib/geo/placeContext.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { formatDistance, formatNearbyForAi, geocodePlace, haversineMeters, type LatLng, type NearbyFacility } from "@/lib/geo/geo";
import { computeDrivingRoutes, fetchNearbyFacilitiesGoogle } from "@/lib/geo/google";

interface PlaceRow {
  id: string;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  source: string;
}

interface GeoListing {
  title: string;
  address: string | null;
  status: string | null;
  point: LatLng;
  nearby: NearbyFacility[];
}

const MAX_NEAREST = 3;
const FACILITY_INTENT = /sekolah|rumah sakit|\brs\b|puskesmas|klinik|pasar|kampus|kuliah|mahasiswa|universitas|masjid|gereja|fasilitas|swalayan|supermarket|\bmall\b|spbu|terminal|dekat apa|sekitar(?:nya)?\s+(?:ada|apa)/i;

/** Frasa jalan/kawasan eksplisit yang boleh di-geocode otomatis (daerah/sekitar/dekat umum TIDAK -- terlalu rawan keliru). */
const EXPLICIT_PLACE_PATTERN = /\b(?:jl\.?|jalan|kawasan|komplek|kompleks)\s+([a-z0-9' ]{3,30}?)(?=[,.?!]|\s+(?:ada|apa|dekat|itu|ya|yg|yang|dari|ke|atau|dan|kah)\b|$)/i;
const PAL_PATTERN = /\bpal\s?(\d{1,2})\b/i;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function findInDictionary(places: PlaceRow[], text: string): PlaceRow | null {
  const haystack = ` ${normalize(text)} `;
  let best: PlaceRow | null = null;
  let bestLength = 0;
  for (const place of places) {
    for (const key of [place.name, ...place.aliases]) {
      const k = normalize(key);
      // Batas kata: singkatan pendek ("ump", "iain") tidak boleh cocok di dalam kata lain ("jumpa", "rumpun").
      if (k.length >= 3 && k.length > bestLength && ` ${haystack.replace(/[^a-z0-9]+/g, " ")} `.includes(` ${k.replace(/[^a-z0-9]+/g, " ")} `)) {
        best = place;
        bestLength = k.length;
      }
    }
  }
  return best;
}

async function loadGeoListings(supabase: SupabaseClient<Database>): Promise<GeoListing[]> {
  const { data } = await supabase.schema("property").from("listings").select("title, address, metadata").is("deleted_at", null);

  const result: GeoListing[] = [];
  for (const row of data ?? []) {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    if (metadata.hidden === true || metadata.hidden === "true") continue;
    const geo = metadata.geo as { lat?: number; lng?: number; nearby?: NearbyFacility[] } | undefined;
    if (!geo || typeof geo.lat !== "number" || typeof geo.lng !== "number") continue;
    result.push({
      title: row.title,
      address: row.address,
      status: (metadata.status as string | undefined) ?? null,
      point: { lat: geo.lat, lng: geo.lng },
      nearby: Array.isArray(geo.nearby) ? geo.nearby : [],
    });
  }
  return result;
}

/**
 * Konteks peta untuk AI Agent -- semua angka dihitung di sini (haversine), bukan oleh LLM:
 * 1. Lead menyebut lokasi (kamus kawasan, atau jalan/kawasan eksplisit yang di-geocode lalu disimpan
 *    sebagai "geocoded/belum diverifikasi") -> listing terdekat + jarak garis lurus.
 * 2. Lead menanyakan fasilitas umum -> fasilitas sekitar listing paling relevan (data OpenStreetMap).
 * Return null kalau tidak ada yang relevan (hemat token).
 */
export async function buildGeoContext(
  supabase: SupabaseClient<Database>,
  message: string,
  relevantListingTitles: string[]
): Promise<string | null> {
  const lines: string[] = [];

  const { data: placeRows } = await supabase
    .schema("knowledge")
    .from("places")
    .select("id, name, aliases, lat, lng, source")
    .eq("review_status", "approved");
  const places = (placeRows ?? []) as PlaceRow[];

  let place = findInDictionary(places, message);

  if (!place) {
    const palMatch = message.match(PAL_PATTERN);
    const explicit = message.match(EXPLICIT_PLACE_PATTERN);
    const phrase = palMatch ? `Pal ${palMatch[1]}` : explicit ? explicit[1].trim() : null;
    if (phrase && phrase.length >= 3) {
      const query = palMatch ? `${phrase} Kubu Raya` : `Jalan ${phrase} Pontianak`;
      const found = await geocodePlace(query);
      if (found) {
        const name = palMatch ? phrase : `Jalan ${phrase}`;
        const inserted = await supabase
          .schema("knowledge")
          .from("places")
          .insert({ name, aliases: [], lat: found.lat, lng: found.lng, source: "geocoded" })
          .select("id, name, aliases, lat, lng, source")
          .maybeSingle();
        place = (inserted.data as PlaceRow | null) ?? { id: "", name, aliases: [], lat: found.lat, lng: found.lng, source: "geocoded" };
      }
    }
  }

  const geoListings = place || FACILITY_INTENT.test(message) ? await loadGeoListings(supabase) : [];

  if (place && geoListings.length > 0) {
    const origin = { lat: place.lat, lng: place.lng };
    const nearest = geoListings
      .map((l) => ({ listing: l, distance: haversineMeters(origin, l.point) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_NEAREST);

    const trust =
      place.source === "geocoded"
        ? "titik hasil pencarian peta otomatis, BELUM diverifikasi -- sebut jaraknya sebagai perkiraan kasar"
        : "titik terverifikasi dari kamus kawasan";
    // Jarak & waktu LEWAT JALAN dari Google Routes (live, tidak disimpan); gagal/tanpa kunci -> garis lurus saja.
    const routes = await computeDrivingRoutes(
      origin,
      nearest.map((n) => n.listing.point)
    );
    const hasRoutes = routes !== null && routes.some((r) => r !== null);

    lines.push(
      hasRoutes
        ? `JARAK DARI "${place.name}" (${trust}). Jarak LEWAT JALAN dan waktu tempuh mobil TANPA kemacetan (Google Routes, dihitung sistem); garis lurus sebagai pembanding:`
        : `JARAK DARI "${place.name}" (${trust}). Jarak garis lurus (dihitung kode); jarak tempuh lewat jalan biasanya lebih jauh:`,
      ...nearest.map((n, i) => {
        const route = routes?.[i];
        const distanceText = route
          ? `lewat jalan sekitar ${formatDistance(route.distanceM)}, kira-kira ${route.durationMin} menit naik mobil tanpa macet (garis lurus ${formatDistance(n.distance)})`
          : `sekitar ${formatDistance(n.distance)} garis lurus`;
        return `${i + 1}. ${n.listing.title}${n.listing.address ? ` (${n.listing.address})` : ""} -- ${distanceText}${n.listing.status ? `, status: ${n.listing.status}` : ""}`;
      })
    );
  }

  if (FACILITY_INTENT.test(message) && geoListings.length > 0) {
    const targets = geoListings.filter((l) => relevantListingTitles.includes(l.title) && l.nearby.length > 0).slice(0, 2);
    for (const [index, target] of targets.entries()) {
      // Google Places live hanya untuk listing paling relevan (hemat biaya); sisanya data OpenStreetMap tersimpan.
      const live = index === 0 ? await fetchNearbyFacilitiesGoogle(target.point) : null;
      if (live) {
        lines.push(`FASILITAS SEKITAR "${target.title}" (Google Maps; kampus/kesehatan/belanja dengan jarak LEWAT JALAN + waktu tempuh dihitung sistem, lainnya garis lurus): ${formatNearbyForAi(live)}`);
      } else {
        lines.push(`FASILITAS SEKITAR "${target.title}" (data OpenStreetMap, bisa tidak lengkap; jarak garis lurus): ${formatNearbyForAi(target.nearby)}`);
      }
    }

    // Patokan penting dari Kamus Kawasan (kampus ternama, dll.) dalam 10 km dari listing.
    for (const target of geoListings.filter((l) => relevantListingTitles.includes(l.title)).slice(0, 2)) {
      const landmarks = places
        .map((p) => ({ name: p.name, point: { lat: p.lat, lng: p.lng }, distance: haversineMeters(target.point, { lat: p.lat, lng: p.lng }) }))
        .filter((p) => p.distance <= 10_000)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6);
      if (landmarks.length > 0) {
        // 4 terdekat dihitung lewat jalan (Google Routes, live, tidak disimpan); sisanya garis lurus.
        const routes = await computeDrivingRoutes(
          target.point,
          landmarks.slice(0, 4).map((p) => p.point)
        );
        const text = landmarks
          .map((p, i) => {
            const route = routes?.[i];
            return route
              ? `${p.name} (lewat jalan ${formatDistance(route.distanceM)}, kira-kira ${route.durationMin} menit naik mobil tanpa macet)`
              : `${p.name} (${formatDistance(p.distance)} garis lurus)`;
          })
          .join(", ");
        lines.push(`PATOKAN PENTING DEKAT "${target.title}" (Kamus Kawasan; jarak lewat jalan dihitung sistem bila tertulis, selain itu garis lurus): ${text}`);
      }
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}
