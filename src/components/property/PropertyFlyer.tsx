// src/components/property/PropertyFlyer.tsx

import { formatRupiah } from "@/lib/property/formatRupiah";

export interface PropertyFlyerData {
  title: string;
  price: number;
  address: string | null;
  coverPhoto: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  landArea: number | null;
  buildingArea: number | null;
}

/**
 * Dirender di luar layar (lihat exportFlyer.ts) lalu di-capture jadi
 * JPG/PDF -- ukuran fixed 1080x1350 (rasio potret) supaya hasilnya konsisten
 * dipakai untuk promosi di media sosial.
 */
export function PropertyFlyer({ data, id }: { data: PropertyFlyerData; id: string }) {
  const specs = [
    data.bedrooms ? `${data.bedrooms} KT` : null,
    data.bathrooms ? `${data.bathrooms} KM` : null,
    data.landArea ? `LT ${data.landArea}m²` : null,
    data.buildingArea ? `LB ${data.buildingArea}m²` : null,
  ].filter(Boolean);

  return (
    <div
      id={id}
      style={{
        width: 1080,
        height: 1350,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          height: 750,
          backgroundColor: "#e5e7eb",
          backgroundImage: data.coverPhoto ? `url(${data.coverPhoto})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div style={{ flex: 1, padding: "40px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 40, fontWeight: 700, margin: 0, color: "#111827", lineHeight: 1.2 }}>
          {data.title}
        </p>
        <p style={{ fontSize: 48, fontWeight: 800, margin: 0, color: "#c8102e" }}>
          {formatRupiah(data.price)}
        </p>
        {data.address && (
          <p style={{ fontSize: 24, margin: 0, color: "#4b5563" }}>{data.address}</p>
        )}
        {specs.length > 0 && (
          <p style={{ fontSize: 26, margin: 0, color: "#111827", fontWeight: 600 }}>
            {specs.join("  •  ")}
          </p>
        )}
      </div>
    </div>
  );
}
