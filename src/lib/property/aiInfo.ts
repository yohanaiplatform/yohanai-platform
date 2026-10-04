// src/lib/property/aiInfo.ts

/**
 * "Info untuk Asisten AI" per listing (metadata.ai_info) -- kategori info resmi yang dibutuhkan AI
 * Agent untuk menjawab konsumen dengan data valid, di luar Tag/Info AI (kata kunci pencarian),
 * Deskripsi, dan data peta (metadata.geo). File polos (tanpa "use client"): dipakai server (prompt AI)
 * dan komponen client (form).
 *
 * Aturan isi: tulis FAKTA yang sudah pasti; kosongkan kalau belum tahu -- AI akan meneruskan ke agen
 * (jangan diisi tebakan).
 */
export interface AiInfoField {
  key: string;
  label: string;
  hint: string;
  rows: number;
}

export const AI_INFO_FIELDS: AiInfoField[] = [
  {
    key: "keunggulan",
    label: "Keunggulan utama",
    hint: "3-5 poin yang membuat listing ini menarik (mis. lokasi, harga, fasilitas, developer).",
    rows: 3,
  },
  {
    key: "skema_bayar",
    label: "Skema pembayaran yang tersedia",
    hint: "KPR subsidi / KPR non-subsidi / cash / cash tempo -- mana yang bisa, beserta catatan (mis. non-subsidi pengajuan).",
    rows: 2,
  },
  {
    key: "dp_akad",
    label: "DP, akad, dan booking",
    hint: "DP + akad (all-in atau tidak), booking dan apakah mengurangi DP, tenor cash tempo.",
    rows: 2,
  },
  {
    key: "biaya_lain",
    label: "Biaya di luar harga",
    hint: "BPHTB, AJB, notaris, materai, dana endapan, biaya KPR -- mana yang SUDAH ditanggung developer dan mana yang BELUM.",
    rows: 2,
  },
  {
    key: "legalitas",
    label: "Legalitas",
    hint: "Jenis sertifikat (SHM/HGB), status pemecahan, PBG/IMB, nama developer/PT.",
    rows: 2,
  },
  {
    key: "kondisi_unit",
    label: "Kondisi dan ketersediaan unit",
    hint: "Ready / indent / siap bangun, progres pembangunan, jumlah unit tersisa, estimasi serah terima.",
    rows: 2,
  },
  {
    key: "posisi_unit",
    label: "Posisi / blok unit",
    hint: "Blok yang tersedia, hadap (pagi/sore), unit hook/standar, harga beda atau sama.",
    rows: 2,
  },
  {
    key: "spesifikasi_tambahan",
    label: "Spesifikasi tambahan",
    hint: "Listrik, air (PDAM/sumur), lebar jalan, keamanan (one gate?), drainase, rawan banjir atau tidak, bahan bangunan.",
    rows: 3,
  },
  {
    key: "akses_lokasi",
    label: "Akses dan patokan lokasi",
    hint: "Waktu tempuh ke pusat kota/kampus/pasar, kondisi jalan menuju lokasi, patokan terdekat. Jarak garis lurus dihitung otomatis dari titik peta, jadi tulis hal yang tidak ada di peta.",
    rows: 2,
  },
  {
    key: "target_pembeli",
    label: "Syarat dan target pembeli",
    hint: "Batas penghasilan, boleh ASN/P3K/karyawan/wiraswasta, usia, syarat khusus lain.",
    rows: 2,
  },
  {
    key: "promo",
    label: "Promo berjalan",
    hint: "Promo yang sedang berlaku beserta masa berlakunya. Kosongkan kalau tidak ada.",
    rows: 2,
  },
  {
    key: "faq",
    label: "Tanya-jawab khusus listing ini",
    hint: "Pertanyaan yang sering ditanyakan + jawaban pastinya. Format: Q: ... A: ... (satu pasang per baris).",
    rows: 4,
  },
  {
    key: "larangan",
    label: "Jangan dijanjikan / rujuk ke agen",
    hint: "Hal yang TIDAK boleh dijawab sendiri oleh asisten (mis. nego harga, jadwal survey, diskon, informasi pemilik).",
    rows: 2,
  },
];

export type AiInfo = Record<string, string>;

const MAX_FIELD_CHARS = 800;

/** Baca metadata.ai_info (object string -> string); selain itu diabaikan. */
export function parseAiInfo(metadata: unknown): AiInfo {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) return {};
  const raw = (metadata as Record<string, unknown>).ai_info;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};

  const result: AiInfo = {};
  for (const field of AI_INFO_FIELDS) {
    const value = (raw as Record<string, unknown>)[field.key];
    if (typeof value === "string" && value.trim()) result[field.key] = value.trim();
  }
  return result;
}

export function countFilledAiInfo(aiInfo: AiInfo): number {
  return AI_INFO_FIELDS.filter((f) => aiInfo[f.key]).length;
}

/** Teks untuk prompt AI: satu baris per kategori yang terisi (null kalau kosong semua). */
export function formatAiInfoForPrompt(aiInfo: AiInfo): string | null {
  const lines = AI_INFO_FIELDS.filter((f) => aiInfo[f.key]).map((f) => {
    const value = aiInfo[f.key].replace(/\s*\n\s*/g, " / ").slice(0, MAX_FIELD_CHARS);
    return `  - ${f.label}: ${value}`;
  });
  return lines.length > 0 ? lines.join("\n") : null;
}
