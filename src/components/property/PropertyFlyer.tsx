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
  status?: string | null;
}

const STATUS_RIBBON: Record<string, { label: string; color: string }> = {
  available: { label: "TERSEDIA", color: "#059669" },
  booked: { label: "DIPESAN", color: "#d97706" },
  sold: { label: "TERJUAL", color: "#dc2626" },
  hold: { label: "DITAHAN", color: "#4b5563" },
};

/**
 * Dirender di luar layar (lihat exportFlyer.ts) lalu di-capture jadi
 * JPG/PDF -- ukuran fixed 1080x1350 (rasio potret) supaya hasilnya konsisten
 * dipakai untuk promosi di media sosial. Inline style dipakai konsisten
 * (bukan className Tailwind) supaya html2canvas pasti menangkap tampilan
 * yang dimaksud tanpa tergantung urutan load stylesheet.
 */
export function PropertyFlyer({ data, id }: { data: PropertyFlyerData; id: string }) {
  const specs = [
    data.bedrooms ? { icon: "🛏", text: `${data.bedrooms} KT` } : null,
    data.bathrooms ? { icon: "🚿", text: `${data.bathrooms} KM` } : null,
    data.landArea ? { icon: "📐", text: `LT ${data.landArea}m²` } : null,
    data.buildingArea ? { icon: "🏠", text: `LB ${data.buildingArea}m²` } : null,
  ].filter(Boolean) as { icon: string; text: string }[];

  const ribbon = data.status ? STATUS_RIBBON[data.status] : null;

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
      {/* Foto sampul + overlay judul/alamat */}
      <div style={{ position: "relative", height: 820, backgroundColor: "#374151", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: data.coverPhoto ? `url(${data.coverPhoto})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.8) 100%)",
          }}
        />

        {ribbon && (
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 40,
              backgroundColor: ribbon.color,
              color: "#ffffff",
              padding: "12px 28px",
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 1.5,
            }}
          >
            {ribbon.label}
          </div>
        )}

        <div style={{ position: "absolute", left: 48, right: 48, bottom: 40 }}>
          <p
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.15,
              textShadow: "0 2px 16px rgba(0,0,0,0.6)",
            }}
          >
            {data.title}
          </p>
          {data.address && (
            <p
              style={{
                fontSize: 28,
                color: "#e5e7eb",
                margin: "14px 0 0",
                textShadow: "0 1px 8px rgba(0,0,0,0.6)",
              }}
            >
              📍 {data.address}
            </p>
          )}
        </div>
      </div>

      {/* Harga + spesifikasi */}
      <div style={{ flex: 1, padding: "44px 48px", display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            backgroundColor: "#c8102e",
            color: "#ffffff",
            padding: "16px 32px",
            borderRadius: 16,
            fontSize: 46,
            fontWeight: 800,
          }}
        >
          {formatRupiah(data.price)}
        </div>

        {specs.length > 0 && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {specs.map((spec) => (
              <div
                key={spec.text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 14,
                  padding: "16px 24px",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                <span style={{ fontSize: 32 }}>{spec.icon}</span>
                {spec.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer brand */}
      <div
        style={{
          height: 64,
          backgroundColor: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, letterSpacing: 3, margin: 0 }}>
          YOHAN.AI PROPERTY
        </p>
      </div>
    </div>
  );
}
