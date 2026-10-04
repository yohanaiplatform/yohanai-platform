"use client";

// src/components/property/PropertyGeoCard.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/geo/geo";

interface NearbyItem {
  category: string;
  name: string;
  distanceM: number;
}

interface PropertyGeoCardProps {
  listingId: string;
  mapsUrl: string | null;
  geo: { lat: number; lng: number; updatedAt?: string; radiusKm?: number; nearby?: NearbyItem[] } | null;
}

/** Titik peta listing + fasilitas umum sekitar (dibaca AI Agent untuk jawab jarak/fasilitas). */
export function PropertyGeoCard({ listingId, mapsUrl, geo }: PropertyGeoCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/properties/geo-refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Gagal memperbarui data lokasi.");
      return;
    }
    const result = await res.json().catch(() => null);
    if (result?.warning) setError(result.warning);
    router.refresh();
  }

  const grouped = new Map<string, NearbyItem[]>();
  for (const item of geo?.nearby ?? []) {
    grouped.set(item.category, [...(grouped.get(item.category) ?? []), item]);
  }

  return (
    <div className="space-y-4">
      {!mapsUrl && (
        <p className="text-sm text-muted-foreground">
          Isi dulu <strong>Link Google Maps</strong> di bagian Spesifikasi (pakai tombol Bagikan di Google Maps),
          lalu klik &quot;Perbarui Data Lokasi&quot;.
        </p>
      )}

      {geo ? (
        <div className="space-y-3">
          <div className="text-sm">
            Koordinat: <strong>{geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</strong>
            {geo.updatedAt && (
              <span className="text-xs text-muted-foreground"> · diperbarui {new Date(geo.updatedAt).toLocaleDateString("id-ID")}{geo.radiusKm ? ` · radius ${geo.radiusKm} km` : ""}</span>
            )}
          </div>
          {grouped.size > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from(grouped.entries()).map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{category}</div>
                  <ul className="text-sm">
                    {items.map((item) => (
                      <li key={item.name} className="flex justify-between gap-3">
                        <span>{item.name}</span>
                        <span className="shrink-0 text-muted-foreground">{formatDistance(item.distanceM)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada fasilitas umum terdata di sekitar titik ini (data OpenStreetMap).</p>
          )}
          <p className="text-xs text-muted-foreground">
            Fasilitas dari OpenStreetMap, bisa belum lengkap. Radius diatur di Settings, Pengaturan Peta (kampus, rumah sakit, dan mall dicari sampai radius penuh). Jarak adalah garis lurus dari titik listing.
          </p>
        </div>
      ) : (
        mapsUrl && <p className="text-sm text-muted-foreground">Data lokasi belum dibuat.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant="outline" onClick={handleRefresh} disabled={loading || !mapsUrl}>
          {loading ? "Memproses..." : "Perbarui Data Lokasi"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
