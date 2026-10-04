// src/lib/geo/geo.ts

/**
 * Utilitas peta (fungsi murni + fetch server-side, tanpa "use client"):
 * - parse/resolve koordinat dari link Google Maps
 * - jarak garis lurus (haversine) -- DIHITUNG KODE, bukan oleh LLM
 * - fasilitas umum sekitar titik (OpenStreetMap Overpass, gratis tanpa API key)
 * - geocoding nama jalan/kawasan (OpenStreetMap Nominatim, dibatasi area Pontianak-Kubu Raya)
 *
 * Catatan kualitas: data OSM di Kalbar belum tentu lengkap (fasilitas bisa kurang) dan hasil
 * geocoding nama jalan kecil bisa keliru -- karena itu hasil geocoding otomatis disimpan sebagai
 * "belum diverifikasi" di Kamus Kawasan supaya bisa dikoreksi manusia.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NearbyFacility {
  category: string;
  name: string;
  distanceM: number;
}

const EARTH_RADIUS_M = 6_371_000;

/** Kotak pencarian geocoding: Pontianak + Kubu Raya (kiri, atas, kanan, bawah). */
const GEOCODE_VIEWBOX = { left: 109.0, top: 0.2, right: 109.65, bottom: -0.35 };

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OSM_UA = "YohanAI-Platform/1.0 (https://yohanai.id)";

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function validCoords(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** Ambil koordinat dari URL Google Maps lengkap (pola @lat,lng, !3d..!4d.., ?q=lat,lng). */
export function parseCoordsFromUrl(url: string): LatLng | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(url);
    } catch {
      return url;
    }
  })();

  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|ll|query|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
  ];
  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) {
      const coords = validCoords(Number(match[1]), Number(match[2]));
      if (coords) return coords;
    }
  }
  return null;
}

/**
 * Koordinat dari link Google Maps APA PUN, termasuk link pendek (maps.app.goo.gl, goo.gl/maps)
 * yang harus diikuti redirect-nya di sisi server. Return null kalau tidak ketemu.
 */
export async function resolveMapsUrl(url: string): Promise<LatLng | null> {
  const direct = parseCoordsFromUrl(url);
  if (direct) return direct;

  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    let res: Response;
    try {
      res = await fetch(current, { redirect: "manual", headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(10_000) });
    } catch {
      return null;
    }

    const location = res.headers.get("location");
    if (location) {
      current = new URL(location, current).toString();
      const coords = parseCoordsFromUrl(current);
      if (coords) return coords;
      continue;
    }

    if (res.ok) {
      const text = await res.text();
      const fromBody = parseCoordsFromUrl(text.slice(0, 200_000));
      if (fromBody) return fromBody;
    }
    return null;
  }
  return null;
}

/** Geocoding nama jalan/kawasan di sekitar Pontianak-Kubu Raya (hasil di luar kotak diabaikan). */
export async function geocodePlace(query: string): Promise<(LatLng & { displayName: string }) | null> {
  const { left, top, right, bottom } = GEOCODE_VIEWBOX;
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "id",
    viewbox: `${left},${top},${right},${bottom}`,
    bounded: "1",
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": OSM_UA },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    const first = rows[0];
    if (!first) return null;
    const coords = validCoords(Number(first.lat), Number(first.lon));
    return coords ? { ...coords, displayName: first.display_name } : null;
  } catch {
    return null;
  }
}

// Server Overpass publik sering sibuk (504) -- beberapa cadangan + jeda antar percobaan.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const CATEGORY_LIMITS: Record<string, number> = {
  Sekolah: 3,
  "Kampus": 2,
  "Kesehatan": 3,
  "Belanja/Pasar": 3,
  "Tempat ibadah": 2,
  SPBU: 1,
  Transportasi: 1,
};

function categoryFromTags(tags: Record<string, string>): string | null {
  switch (tags.amenity) {
    case "school":
    case "kindergarten":
      return "Sekolah";
    case "university":
    case "college":
      return "Kampus";
    case "hospital":
    case "clinic":
      return "Kesehatan";
    case "marketplace":
      return "Belanja/Pasar";
    case "place_of_worship":
      return "Tempat ibadah";
    case "fuel":
      return "SPBU";
    case "bus_station":
      return "Transportasi";
  }
  if (tags.shop === "supermarket" || tags.shop === "mall") return "Belanja/Pasar";
  return null;
}

/**
 * Fasilitas umum terdekat (nama bertanda saja) dalam radius, dikelompokkan per kategori.
 * Return null kalau SEMUA server Overpass gagal (beda dari array kosong = memang tidak ada data).
 */
export async function fetchNearbyFacilities(center: LatLng, radiusM = 2000): Promise<NearbyFacility[] | null> {
  const query = `[out:json][timeout:25];
(
  nwr(around:${radiusM},${center.lat},${center.lng})[amenity~"^(school|kindergarten|university|college|hospital|clinic|marketplace|fuel|bus_station|place_of_worship)$"][name];
  nwr(around:${radiusM},${center.lat},${center.lng})[shop~"^(supermarket|mall)$"][name];
);
out center 200;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "User-Agent": OSM_UA, "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(30_000),
        });
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok || !contentType.includes("json")) continue;

        const json = (await res.json()) as {
          elements: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[];
        };

        const all: NearbyFacility[] = [];
        for (const el of json.elements ?? []) {
          const tags = el.tags ?? {};
          const category = categoryFromTags(tags);
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (!category || !tags.name || lat === undefined || lng === undefined) continue;
          all.push({ category, name: tags.name, distanceM: Math.round(haversineMeters(center, { lat, lng })) });
        }

        const result: NearbyFacility[] = [];
        for (const [category, limit] of Object.entries(CATEGORY_LIMITS)) {
          const seen = new Set<string>();
          all
            .filter((f) => f.category === category)
            .sort((a, b) => a.distanceM - b.distanceM)
            .filter((f) => (seen.has(f.name) ? false : (seen.add(f.name), true)))
            .slice(0, limit)
            .forEach((f) => result.push(f));
        }
        return result;
      } catch {
        // coba lagi / endpoint cadangan
      }
    }
  }
  return null;
}

export function formatNearbyForAi(nearby: NearbyFacility[]): string {
  const byCategory = new Map<string, string[]>();
  for (const f of nearby) {
    const list = byCategory.get(f.category) ?? [];
    list.push(`${f.name} (${formatDistance(f.distanceM)})`);
    byCategory.set(f.category, list);
  }
  return Array.from(byCategory.entries())
    .map(([category, items]) => `${category}: ${items.join(", ")}`)
    .join("; ");
}
