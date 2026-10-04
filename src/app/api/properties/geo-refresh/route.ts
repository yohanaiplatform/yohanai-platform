// src/app/api/properties/geo-refresh/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchNearbyFacilities, resolveMapsUrl } from "@/lib/geo/geo";
import type { Json } from "@/types/database";

/**
 * Perbarui data lokasi listing: baca metadata.maps_url -> koordinat -> fasilitas umum sekitar
 * (OpenStreetMap) -> simpan ke metadata.geo. Diamankan sesi login; RLS listings_owner_or_admin
 * membatasi ke listing milik agen / admin.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { listingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.listingId) return NextResponse.json({ error: "listingId wajib diisi" }, { status: 400 });

  const { data: listing } = await supabase
    .schema("property")
    .from("listings")
    .select("id, metadata")
    .eq("id", body.listingId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

  const metadata =
    typeof listing.metadata === "object" && listing.metadata !== null && !Array.isArray(listing.metadata)
      ? (listing.metadata as Record<string, Json>)
      : {};

  const mapsUrl = typeof metadata.maps_url === "string" ? metadata.maps_url.trim() : "";
  if (!mapsUrl) {
    return NextResponse.json({ error: "Isi dulu \"Link Google Maps\" di bagian Spesifikasi." }, { status: 400 });
  }

  const coords = await resolveMapsUrl(mapsUrl);
  if (!coords) {
    return NextResponse.json(
      { error: "Koordinat tidak terbaca dari link itu. Pakai tombol Bagikan di Google Maps, lalu tempel link-nya." },
      { status: 422 }
    );
  }

  const fetched = await fetchNearbyFacilities(coords);
  // Server peta sibuk (null): simpan koordinat, pertahankan fasilitas lama kalau ada.
  const previousGeo = typeof metadata.geo === "object" && metadata.geo !== null && !Array.isArray(metadata.geo) ? (metadata.geo as Record<string, Json>) : {};
  const nearby = fetched ?? (Array.isArray(previousGeo.nearby) ? previousGeo.nearby : []);

  const geo = {
    lat: coords.lat,
    lng: coords.lng,
    mapsUrl,
    updatedAt: new Date().toISOString(),
    nearby,
  };

  const { error } = await supabase
    .schema("property")
    .from("listings")
    .update({ metadata: { ...metadata, geo } as unknown as Json })
    .eq("id", listing.id);
  if (error) return NextResponse.json({ error: "Gagal menyimpan data lokasi" }, { status: 500 });

  return NextResponse.json({
    success: true,
    geo,
    warning: fetched === null ? "Koordinat tersimpan, tetapi daftar fasilitas sekitar belum bisa diambil (server peta sedang sibuk). Coba lagi beberapa menit lagi." : null,
  });
}
