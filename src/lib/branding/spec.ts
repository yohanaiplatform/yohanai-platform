// src/lib/branding/spec.ts
//
// Standar gambar logo/watermark per pengguna. File polos (server + client): dipakai pemeriksaan di browser (umpan balik
// langsung) DAN di server (yang berwibawa). Gambar yang tidak memenuhi standar DITOLAK dengan alasan yang jelas dan
// pengguna diminta mengedit ulang.

export type BrandingKind = "watermark" | "logo";

export interface BrandingSpec {
  label: string;
  formats: ("png" | "jpeg")[];
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  /** Rasio lebar/tinggi yang diizinkan. */
  minRatio: number;
  maxRatio: number;
  maxBytes: number;
  /** Wajib punya latar transparan (PNG dengan alpha). */
  needsTransparency: boolean;
}

export const BRANDING_SPECS: Record<BrandingKind, BrandingSpec> = {
  watermark: {
    label: "Watermark foto",
    formats: ["png"],
    minWidth: 600,
    maxWidth: 2400,
    minHeight: 150,
    minRatio: 1,
    maxRatio: 4,
    maxBytes: 1_500_000,
    needsTransparency: true,
  },
  logo: {
    label: "Logo dokumen",
    formats: ["png", "jpeg"],
    minWidth: 600,
    maxWidth: 2400,
    minHeight: 150,
    minRatio: 1,
    maxRatio: 4.5,
    maxBytes: 1_500_000,
    needsTransparency: false,
  },
};

/** Minimal bagian piksel transparan agar watermark tidak berupa kotak penuh yang menutupi foto. */
export const MIN_TRANSPARENT_RATIO = 0.05;

export interface BrandingImageInfo {
  format: "png" | "jpeg" | null;
  width: number;
  height: number;
  bytes: number;
  /** PNG punya kanal alpha / tRNS (server) atau terdeteksi ada piksel transparan (browser). */
  hasAlpha: boolean;
  /** Bagian piksel transparan 0..1 (hanya diketahui di browser; undefined = tidak diperiksa). */
  transparentRatio?: number;
}

const mb = (n: number) => `${(n / 1_000_000).toFixed(1)} MB`;

/** Daftar alasan penolakan; kosong = gambar memenuhi standar. */
export function validateBrandingImage(kind: BrandingKind, info: BrandingImageInfo): string[] {
  const spec = BRANDING_SPECS[kind];
  const errors: string[] = [];

  if (!info.format || !spec.formats.includes(info.format)) {
    errors.push(`Format harus ${spec.formats.map((f) => (f === "png" ? "PNG" : "JPG")).join(" atau ")}.`);
    return errors;
  }
  if (info.bytes > spec.maxBytes) errors.push(`Ukuran file ${mb(info.bytes)} melebihi batas ${mb(spec.maxBytes)}. Kecilkan/kompres gambarnya.`);
  if (info.width < spec.minWidth) errors.push(`Lebar ${info.width}px terlalu kecil; minimal ${spec.minWidth}px agar tidak pecah. Gunakan gambar beresolusi lebih besar.`);
  if (info.width > spec.maxWidth) errors.push(`Lebar ${info.width}px terlalu besar; maksimal ${spec.maxWidth}px. Perkecil dimensinya.`);
  if (info.height < spec.minHeight) errors.push(`Tinggi ${info.height}px terlalu kecil; minimal ${spec.minHeight}px.`);
  if (info.height > 0) {
    const ratio = info.width / info.height;
    if (ratio < spec.minRatio || ratio > spec.maxRatio) {
      errors.push(
        `Bentuk gambar ${ratio.toFixed(2)}:1 tidak sesuai; harus lebar:tinggi antara ${spec.minRatio}:1 dan ${spec.maxRatio}:1 (mendatar/persegi, bukan menjulang). Potong sisa ruang kosong di tepi gambar.`
      );
    }
  }
  if (spec.needsTransparency) {
    if (!info.hasAlpha) {
      errors.push("Watermark harus PNG dengan latar belakang TRANSPARAN (bukan berlatar putih/warna). Hapus latar belakangnya lalu ekspor sebagai PNG.");
    } else if (info.transparentRatio !== undefined && info.transparentRatio < MIN_TRANSPARENT_RATIO) {
      errors.push("Hampir seluruh gambar tidak transparan (kotak penuh) sehingga akan menutupi foto. Hapus latar belakangnya sampai hanya logo/teks yang terlihat.");
    }
  }
  return errors;
}

/** Ringkasan standar untuk ditampilkan ke pengguna. */
export function specSummary(kind: BrandingKind): string[] {
  const s = BRANDING_SPECS[kind];
  const lines = [
    `Format: ${s.formats.map((f) => (f === "png" ? "PNG" : "JPG")).join(" atau ")}${s.needsTransparency ? ", latar belakang transparan" : ""}`,
    `Lebar ${s.minWidth}-${s.maxWidth}px, tinggi minimal ${s.minHeight}px`,
    `Bentuk mendatar atau persegi (lebar : tinggi antara ${s.minRatio}:1 dan ${s.maxRatio}:1)`,
    `Ukuran file maksimal ${mb(s.maxBytes)}`,
  ];
  return lines;
}
