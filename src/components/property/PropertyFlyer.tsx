// src/components/property/PropertyFlyer.tsx

import { formatRupiah } from "@/lib/property/formatRupiah";

export interface PropertyFlyerData {
  title: string;
  price: number;
  address: string | null;
  photoUrls: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  landArea: number | null;
  buildingArea: number | null;
  carport: number | null;
  certificateType: string | null;
  contactPhone: string | null;
  status?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  available: "TERSEDIA",
  booked: "DIPESAN",
  sold: "TERJUAL",
  hold: "DITAHAN",
};

// Palet hangat/editorial (coklat tua + krem + emas) -- meniru gaya flyer real
// estate premium (referensi: template Canva "Brown and Beige Modern Luxury
// Real Estate Flyer") tanpa benar-benar memakai engine Canva. Lihat
// exportFlyer.ts untuk cara di-capture jadi JPG/PDF.
const INK = "#2d2013";
const GOLD = "#a9762f";
const CREAM = "#f5f0e6";

function Photo({ url, style }: { url: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#3a3126",
        ...style,
      }}
    />
  );
}

/**
 * Dirender di luar layar (lihat exportFlyer.ts) lalu di-capture jadi
 * JPG/PDF -- ukuran fixed 1080x1350 (rasio A4-ish potret). Inline style
 * dipakai konsisten (bukan className Tailwind) supaya html2canvas pasti
 * menangkap tampilan yang dimaksud.
 */
export function PropertyFlyer({ data, id }: { data: PropertyFlyerData; id: string }) {
  const [cover, ...rest] = data.photoUrls;
  const secondary = rest.slice(0, 2);

  const checklist = [
    data.bedrooms ? `${data.bedrooms} Kamar Tidur` : null,
    data.bathrooms ? `${data.bathrooms} Kamar Mandi` : null,
    data.landArea ? `Luas Tanah ${data.landArea} m²` : null,
    data.buildingArea ? `Luas Bangunan ${data.buildingArea} m²` : null,
    data.carport ? `Carport ${data.carport} mobil` : null,
    data.certificateType ? `Sertifikat ${data.certificateType}` : null,
  ].filter(Boolean) as string[];

  const statusLabel = data.status ? STATUS_LABEL[data.status] : null;
  const heroHeight = secondary.length > 0 ? 660 : 780;

  return (
    <div
      id={id}
      style={{
        width: 1080,
        height: 1350,
        display: "flex",
        flexDirection: "column",
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Foto utama + judul overlay */}
      <div style={{ position: "relative", height: heroHeight, overflow: "hidden" }}>
        {cover ? (
          <Photo url={cover} style={{ position: "absolute", inset: 0 }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#3a3126" }} />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(20,14,8,0.88) 100%)",
          }}
        />

        {statusLabel && (
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 40,
              backgroundColor: GOLD,
              color: "#ffffff",
              padding: "10px 26px",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {statusLabel}
          </div>
        )}

        <div style={{ position: "absolute", left: 56, right: 56, bottom: 44 }}>
          <div
            style={{
              width: 64,
              height: 3,
              backgroundColor: GOLD,
              marginBottom: 20,
            }}
          />
          <p
            style={{
              fontSize: 56,
              fontWeight: 700,
              fontStyle: "italic",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {data.title}
          </p>
          {data.address && (
            <p style={{ fontSize: 24, color: "#e8dfd0", margin: "14px 0 0", letterSpacing: 0.5 }}>
              {data.address}
            </p>
          )}
        </div>
      </div>

      {/* Kolase 2 foto tambahan (kalau ada) */}
      {secondary.length > 0 && (
        <div style={{ display: "flex", height: 160, gap: 4, backgroundColor: INK }}>
          {secondary.map((url) => (
            <Photo key={url} url={url} style={{ flex: 1 }} />
          ))}
          {secondary.length === 1 && <div style={{ flex: 1 }} />}
        </div>
      )}

      {/* Harga + checklist spesifikasi */}
      <div style={{ flex: 1, padding: "48px 56px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: GOLD, margin: 0 }}>
            HARGA MULAI DARI
          </p>
          <p style={{ fontSize: 58, fontWeight: 700, color: INK, margin: "6px 0 0" }}>
            {formatRupiah(data.price)}
          </p>
        </div>

        {checklist.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {checklist.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    backgroundColor: GOLD,
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: 28, color: INK }}>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer kontak */}
      <div
        style={{
          height: 110,
          backgroundColor: INK,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {data.contactPhone && (
          <p style={{ color: "#ffffff", fontSize: 32, fontWeight: 700, margin: 0, fontFamily: "Arial, sans-serif" }}>
            📞 {data.contactPhone}
          </p>
        )}
        <p
          style={{
            color: GOLD,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            margin: 0,
            fontFamily: "Arial, sans-serif",
          }}
        >
          YOHAN.AI PROPERTY
        </p>
      </div>
    </div>
  );
}
