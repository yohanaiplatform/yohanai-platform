// src/lib/geo/google.ts

import { haversineMeters, type LatLng, type NearbyFacility } from "@/lib/geo/geo";

/**
 * Google Maps Platform (API resmi) -- DIPANGGIL LANGSUNG saat konsumen bertanya, HASILNYA TIDAK DISIMPAN
 * (syarat layanan Google membatasi penyimpanan konten Places/Routes). Butuh env GOOGLE_MAPS_API_KEY dengan
 * layanan "Places API (New)" dan "Routes API" aktif. Tanpa kunci / gagal -> return null dan pemanggil
 * jatuh ke cadangan (garis lurus / data OpenStreetMap).
 */

export interface RouteResult {
  distanceM: number;
  durationMin: number;
}

function apiKey(): string | null {
  return process.env.GOOGLE_MAPS_API_KEY || null;
}

/**
 * Jarak & waktu tempuh LEWAT JALAN (mobil) dari satu titik ke banyak tujuan -- satu panggilan matriks.
 * Waktu tempuh TANPA kondisi lalu lintas (TRAFFIC_UNAWARE, lebih murah). Index hasil = index destinations.
 */
export async function computeDrivingRoutes(origin: LatLng, destinations: LatLng[]): Promise<(RouteResult | null)[] | null> {
  const key = apiKey();
  if (!key || destinations.length === 0) return null;

  const waypoint = (p: LatLng) => ({ waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } });

  try {
    const res = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,condition",
      },
      body: JSON.stringify({
        origins: [waypoint(origin)],
        destinations: destinations.map(waypoint),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as {
      destinationIndex?: number;
      distanceMeters?: number;
      duration?: string;
      condition?: string;
    }[];

    const results: (RouteResult | null)[] = destinations.map(() => null);
    for (const row of rows) {
      if (row.destinationIndex === undefined || row.condition !== "ROUTE_EXISTS" || row.distanceMeters === undefined) continue;
      const seconds = Number((row.duration ?? "0s").replace("s", ""));
      results[row.destinationIndex] = { distanceM: row.distanceMeters, durationMin: Math.max(1, Math.round(seconds / 60)) };
    }
    return results;
  } catch {
    return null;
  }
}

/** Kelompok jenis tempat (Places API New) -> kategori tampilan, dengan radius maksimum per kategori. */
const PLACE_GROUPS: { category: string; types: string[]; radiusM: number; limit: number }[] = [
  { category: "Kampus", types: ["university"], radiusM: 10_000, limit: 4 },
  { category: "Kesehatan", types: ["hospital", "doctor"], radiusM: 5_000, limit: 3 },
  { category: "Belanja/Pasar", types: ["supermarket", "shopping_mall", "grocery_store"], radiusM: 5_000, limit: 3 },
  { category: "Sekolah", types: ["primary_school", "secondary_school", "school", "preschool"], radiusM: 3_000, limit: 3 },
  { category: "Tempat ibadah", types: ["mosque", "church", "hindu_temple", "buddhist_temple"], radiusM: 2_000, limit: 2 },
  { category: "SPBU", types: ["gas_station"], radiusM: 5_000, limit: 1 },
  { category: "Transportasi", types: ["bus_station", "transit_station"], radiusM: 5_000, limit: 1 },
];

async function searchGroup(center: LatLng, group: (typeof PLACE_GROUPS)[number], key: string): Promise<NearbyFacility[]> {
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.displayName,places.location",
      },
      body: JSON.stringify({
        includedTypes: group.types,
        maxResultCount: 10,
        rankPreference: "DISTANCE",
        languageCode: "id",
        regionCode: "ID",
        locationRestriction: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: group.radiusM } },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { places?: { displayName?: { text?: string }; location?: { latitude: number; longitude: number } }[] };
    const result: NearbyFacility[] = [];
    for (const place of json.places ?? []) {
      const name = place.displayName?.text;
      if (!name || !place.location) continue;
      const distanceM = Math.round(haversineMeters(center, { lat: place.location.latitude, lng: place.location.longitude }));
      if (distanceM <= group.radiusM) result.push({ category: group.category, name, distanceM });
    }
    return result.sort((a, b) => a.distanceM - b.distanceM).slice(0, group.limit);
  } catch {
    return [];
  }
}

/**
 * Fasilitas umum terdekat dari Google Places (live, tidak disimpan). Return null kalau tidak ada kunci
 * atau semua panggilan gagal/kosong (pemanggil memakai data OpenStreetMap yang tersimpan).
 */
export async function fetchNearbyFacilitiesGoogle(center: LatLng): Promise<NearbyFacility[] | null> {
  const key = apiKey();
  if (!key) return null;
  const groups = await Promise.all(PLACE_GROUPS.map((group) => searchGroup(center, group, key)));
  const all = groups.flat();
  return all.length > 0 ? all : null;
}
