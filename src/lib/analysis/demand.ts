// src/lib/analysis/demand.ts

import type { CountItem, DemandMetrics, DemandRow } from "@/lib/analysis/types";

/**
 * Kamus area/proyek untuk menyatukan tulisan bebas "minat unit/lokasi" lead ("Kapur MAs", "kpaur mas", "Desa Kapur")
 * dan teks listing (judul + alamat + tag). Satu pola dipakai di dua sisi supaya permintaan dan stok dicocokkan dengan
 * cara yang sama. Tambahkan area baru di sini; istilah yang belum terpetakan tampil di laporan ("belum terpetakan")
 * sebagai petunjuk apa yang perlu ditambahkan.
 */
export const AREAS: { key: string; label: string; pattern: RegExp }[] = [
  { key: "kapur", label: "Kapur Mas / Desa Kapur", pattern: /kapur ?mas|kpaur|kapurmas|desa kapur|deskap/i },
  { key: "gfa", label: "GFA / Grand FA", pattern: /\bgfa\b|grand ?fa/i },
  { key: "alamasri", label: "Alam Asri", pattern: /alam ?asri/i },
  { key: "serdam", label: "Serdam / Sungai Raya Dalam", pattern: /serdam|sungai raya|sei raya/i },
  { key: "kotabaru", label: "Kotabaru / Kobar", pattern: /kota ?baru|kobar/i },
  { key: "hosana", label: "Hosana Excelsia", pattern: /hosana/i },
  { key: "pal", label: "Kakap / Pal (Pal 5-9)", pattern: /\bpal ?\d?\b|kakap/i },
  { key: "untan", label: "Sekitar Untan / Paris", pattern: /untan|paris ?\d|parit h\.? ?husein|parit h\.? ?husin/i },
  { key: "siantan", label: "Siantan", pattern: /siantan/i },
  { key: "ampera", label: "Ampera / Ambawang / Padat Karya", pattern: /ampera|ambawang|padat karya/i },
  { key: "parit", label: "Parit Mayor / Pontianak Timur", pattern: /parit mayor|pontianak timur|tanray|tanjung raya|jl\.? ?pemda/i },
  { key: "ujungpandang", label: "Ujung Pandang / Sungai Jawi", pattern: /ujung pandang|sungai jawi|cendana/i },
  { key: "sepakat", label: "Sepakat / Pontianak Kota", pattern: /sepakat|dr\.? ?wahidin|pontianak kota/i },
  { key: "mempawah", label: "Mempawah / Sintang / luar Pontianak", pattern: /mempawah|singkawang|sintang|bengkayang|sanggau|kendawangan/i },
];

/** Jawaban "belum menentukan" -- bukan permintaan lokasi sungguhan. */
const UNDECIDED = /^\s*$|belum (tau|tahu|ada|menentukan|pasti|jelas)|^belum$|(nga|ngga|nggak|gak|ga|tidak|tdk) (jelas|tau|tahu|ada)|tanya dulu|lihat dulu/i;

const MIN_DEMAND_FOR_GAP = 5;
const MIN_HISTORIC_DEMAND = 20;
const MAX_UNMAPPED = 8;

export interface DemandInput {
  /** Lead dengan isian "minat unit/lokasi" (teks bebas), Temperature saat ini, dan waktu dibuat. */
  leads: { createdAt: string; temperature: string; interest: string }[];
  /** Listing tersedia (tidak disembunyikan): teks gabungan judul + alamat + tag. */
  listings: { text: string }[];
  /** Batas "baru" (ISO) untuk menghitung permintaan 30 hari terakhir. */
  recentSince: string;
}

/**
 * Permintaan vs stok: per area, berapa lead yang menyebutnya (seluruh riwayat dan 30 hari terakhir), berapa yang Hot/Warm,
 * dan berapa listing tersedia di area itu. Area dengan permintaan 30 hari >= 5 lead tetapi stok 0 ditandai "kosong".
 * Hanya hitungan; teks mentah lead tidak keluar kecuali istilah belum terpetakan (huruf kecil, maks 8, sudah dikelompokkan).
 */
export function computeDemandMetrics(input: DemandInput): DemandMetrics {
  const stock = new Map<string, number>();
  for (const listing of input.listings) {
    for (const area of AREAS) if (area.pattern.test(listing.text)) stock.set(area.key, (stock.get(area.key) ?? 0) + 1);
  }

  const rows = new Map<string, DemandRow>(
    AREAS.map((a) => [a.key, { label: a.label, leads: 0, leads30: 0, hotWarm: 0, stock: stock.get(a.key) ?? 0, gap: false, historicGap: false }])
  );
  const unmapped = new Map<string, number>();
  let undecided = 0;
  let withInterest = 0;

  for (const lead of input.leads) {
    const interest = lead.interest.trim();
    if (UNDECIDED.test(interest)) {
      undecided += 1;
      continue;
    }
    withInterest += 1;
    const matched = AREAS.filter((a) => a.pattern.test(interest));
    if (matched.length === 0) {
      const key = interest.toLowerCase().replace(/\s+/g, " ").slice(0, 40);
      unmapped.set(key, (unmapped.get(key) ?? 0) + 1);
      continue;
    }
    const warm = lead.temperature === "Hot" || lead.temperature === "Warm";
    for (const area of matched) {
      const row = rows.get(area.key);
      if (!row) continue;
      row.leads += 1;
      if (lead.createdAt >= input.recentSince) row.leads30 += 1;
      if (warm) row.hotWarm += 1;
    }
  }

  const result = Array.from(rows.values())
    .filter((r) => r.leads > 0 || r.stock > 0)
    .map((r) => ({
      ...r,
      gap: r.leads30 >= MIN_DEMAND_FOR_GAP && r.stock === 0,
      historicGap: r.stock === 0 && r.leads >= MIN_HISTORIC_DEMAND,
    }))
    .sort((a, b) => b.leads30 - a.leads30 || b.leads - a.leads);

  const unmappedItems: CountItem[] = Array.from(unmapped.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_UNMAPPED);

  return { leadsWithInterest: withInterest, undecided, rows: result, unmapped: unmappedItems, minDemandForGap: MIN_DEMAND_FOR_GAP, minHistoricDemand: MIN_HISTORIC_DEMAND };
}
