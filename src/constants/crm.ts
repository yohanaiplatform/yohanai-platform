// src/constants/crm.ts

/**
 * Nilai "Kategory" persis seperti opsi dropdown di Google Form legacy.
 * Diambil langsung dari data yang sudah masuk (bukan query live) karena
 * belum ada tabel property yang jadi sumber kebenaran untuk ini -- kalau
 * Google Form-nya berubah, daftar ini perlu disesuaikan manual.
 */
export const LEAD_KATEGORI_OPTIONS = [
  "Calon Konsumen Kapur Mas",
  "Calon Konsumen PJP",
  "Kons. Cari Rumah Murah",
  "Kons. Hosana Excelsia",
  "Calon Konsumen Tanah Pak Usjan",
  "Kons. Tanah Bg. Anto",
  "Cari Tanah",
  "Kons. Alam Asri",
] as const;

/**
 * Nilai "Sumber Informasi" persis seperti opsi dropdown di Google Form
 * legacy -- sama seperti LEAD_KATEGORI_OPTIONS, diambil dari data yang
 * sudah masuk (bukan tabel sumber kebenaran), jadi perlu disesuaikan
 * manual kalau Google Form-nya berubah.
 */
export const LEAD_SUMBER_OPTIONS = [
  "Iklan (Meta/Google)",
  "Ketemu di Lokasi",
  "Dari Teman/Saudara/Referal",
  "Lihat Baliho",
  "Lainnya",
] as const;

/**
 * "Temperature" lead (metadata->>status_funnel_awal) -- 5 kategori sesuai
 * status funnel di spreadsheet legacy, dipakai juga di tile Lead Funnel
 * dashboard (lihat getLeadSummary.ts).
 */
export const LEAD_TEMPERATURE_OPTIONS = [
  "Hot",
  "Warm",
  "Cold",
  "Closing",
  "Batal",
] as const;

/**
 * metadata.alasan_status -- alasan di balik status akhir lead (Batal/Closing), dicatat agen saat mengubah Temperature.
 * Dasar "kebenaran" untuk analisis perilaku (bukan tebakan kata kunci). Label Batal sengaja sejajar dengan jenis keberatan
 * di src/lib/analysis/objections.ts supaya hasil keduanya bisa dibandingkan nanti.
 */
export const LEAD_ALASAN_BATAL_OPTIONS = [
  "Harga terlalu mahal / di luar budget",
  "DP terlalu besar / berat",
  "Cicilan terlalu berat",
  "KPR ditolak / masalah SLIK",
  "Penghasilan / slip gaji belum memenuhi",
  "Lokasi terlalu jauh / tidak cocok",
  "Ukuran / spesifikasi kurang sesuai",
  "Ragu legalitas / developer",
  "Sudah dapat / memilih rumah lain",
  "Ditunda / belum siap",
  "Tidak merespons lagi",
  "Bukan calon pembeli / salah sambung",
  "Lainnya",
] as const;

export const LEAD_ALASAN_CLOSING_OPTIONS = [
  "Harga dan DP sesuai",
  "Lokasi cocok",
  "Promo / bonus menarik",
  "Proses KPR dibantu / dipermudah",
  "Kepercayaan pada agen / developer",
  "Kebutuhan mendesak (siap pindah)",
  "Rekomendasi kerabat / teman",
  "Lainnya",
] as const;

/** Temperature yang meminta alasan, dan daftar pilihannya. */
export function reasonOptionsFor(temperature: string): readonly string[] | null {
  if (temperature === "Batal") return LEAD_ALASAN_BATAL_OPTIONS;
  if (temperature === "Closing") return LEAD_ALASAN_CLOSING_OPTIONS;
  return null;
}

/** metadata->>sudah_survey -- nilai persis dari data Google Form (bukan boolean). */
export const LEAD_SUDAH_SURVEY_OPTIONS = ["Sudah", "Belum"] as const;
