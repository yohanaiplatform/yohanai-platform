// src/lib/analysis/reasons.ts

import type { CountItem, ReasonMetrics } from "@/lib/analysis/types";

export interface ReasonInput {
  /** Lead berstatus akhir (Temperature Batal atau Closing*) beserta alasan yang dicatat agen (bila ada). */
  leads: { temperature: string; alasan: string | null }[];
}

function toItems(map: Map<string, number>): CountItem[] {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Alasan Batal/Closing yang DICATAT AGEN (metadata.alasan_status) -- kebenaran dasar, berbeda dari keberatan hasil tebakan
 * kata kunci. Kelengkapan (berapa lead Batal/Closing yang sudah punya alasan) ikut dilaporkan: selama rendah, jangan
 * menarik kesimpulan dari distribusinya. Lead lama (sebelum fitur ini) tidak punya alasan dan memang tidak ditebak.
 */
export function computeReasonMetrics(input: ReasonInput): ReasonMetrics {
  const batal = new Map<string, number>();
  const closing = new Map<string, number>();
  let batalTotal = 0;
  let closingTotal = 0;
  let batalWithReason = 0;
  let closingWithReason = 0;
  for (const lead of input.leads) {
    if (lead.temperature === "Batal") {
      batalTotal += 1;
      if (lead.alasan) {
        batalWithReason += 1;
        batal.set(lead.alasan, (batal.get(lead.alasan) ?? 0) + 1);
      }
    } else if (lead.temperature.startsWith("Closing")) {
      closingTotal += 1;
      if (lead.alasan) {
        closingWithReason += 1;
        closing.set(lead.alasan, (closing.get(lead.alasan) ?? 0) + 1);
      }
    }
  }
  return {
    batalTotal,
    batalWithReason,
    closingTotal,
    closingWithReason,
    batal: toItems(batal),
    closing: toItems(closing),
  };
}
