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
 * fetch ke Google dengan satu kali ulang untuk kegagalan sementara (jaringan/timeout, 429, 5xx) dan log penyebab
 * kegagalan (status + pesan Google) ke log server -- sebelumnya semua kegagalan ditelan diam-diam sehingga jawaban AI
 * jatuh ke garis lurus tanpa jejak. Return null kalau tetap gagal.
 */
async function googleFetch(label: string, url: string, init: RequestInit, timeoutMs: number): Promise<Response | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) return res;
      const body = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[google-geo] ${label} gagal HTTP ${res.status} (percobaan ${attempt}): ${body}`);
      if (res.status !== 429 && res.status < 500) return null;
    } catch (error) {
      console.error(`[google-geo] ${label} error (percobaan ${attempt}): ${error instanceof Error ? error.message : String(error)}`);
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return null;
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
    const res = await googleFetch(
      "Routes",
      "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
      {
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
      },
      10_000
    );
    if (!res) return null;

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
  } catch (error) {
    console.error(`[google-geo] Routes hasil tidak terbaca: ${error instanceof Error ? error.message : String(error)}`);
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

const ROUTED_CATEGORIES = ["Kampus", "Kesehatan", "Belanja/Pasar"];

async function searchGroup(center: LatLng, group: (typeof PLACE_GROUPS)[number], key: string): Promise<NearbyFacility[]> {
  try {
    const res = await googleFetch(
      `Places ${group.category}`,
      "https://places.googleapis.com/v1/places:searchNearby",
      {
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
      },
      8_000
    );
    if (!res) return [];

    const json = (await res.json()) as { places?: { displayName?: { text?: string }; location?: { latitude: number; longitude: number } }[] };
    const result: NearbyFacility[] = [];
    for (const place of json.places ?? []) {
      const name = place.displayName?.text;
      if (!name || !place.location) continue;
      const distanceM = Math.round(haversineMeters(center, { lat: place.location.latitude, lng: place.location.longitude }));
      if (distanceM <= group.radiusM) {
        result.push({ category: group.category, name, distanceM, point: { lat: place.location.latitude, lng: place.location.longitude } });
      }
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
  if (all.length === 0) return null;

  // Jarak lewat jalan + waktu tempuh hanya untuk kategori yang penting bagi pembeli (hemat biaya Routes);
  // sekolah, tempat ibadah, SPBU, transportasi cukup garis lurus.
  const routeable = all.filter((f) => ROUTED_CATEGORIES.includes(f.category) && f.point);
  const routes = routeable.length > 0 ? await computeDrivingRoutes(center, routeable.map((f) => f.point as LatLng)) : null;
  routeable.forEach((f, i) => {
    const route = routes?.[i];
    if (route) {
      f.routeDistanceM = route.distanceM;
      f.durationMin = route.durationMin;
    }
  });
  return all;
}
