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

/** metadata->>sudah_survey -- nilai persis dari data Google Form (bukan boolean). */
export const LEAD_SUDAH_SURVEY_OPTIONS = ["Sudah", "Belum"] as const;
