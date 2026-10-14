// src/lib/analysis/objections.ts

import type { ObjectionMetrics, ObjectionRow } from "@/lib/analysis/types";
import { reachedHot } from "@/lib/analysis/topics";

/**
 * Kamus keberatan calon pembeli (pencocokan kata kunci di KODE, bukan LLM). Pola sengaja menuntut kata penegas
 * ("terlalu", "kemahalan", "tidak cukup", "ditolak") supaya pertanyaan netral seperti "berapa jauh dari kampus?" atau
 * "DP berapa?" tidak terhitung keberatan. Meleset ke sisi hati-hati: lebih baik kurang menghitung daripada menuduh.
 */
export const OBJECTIONS: { key: string; label: string; pattern: RegExp }[] = [
  { key: "harga", label: "Harga terlalu mahal / di luar budget", pattern: /(mahal|kemahalan|di ?luar budget|di ?atas budget|over budget|budget (saya |kami )?(kurang|belum|tidak|nggak|gak)|belum cukup dana|kurang dana)/i },
  { key: "dp", label: "DP terlalu besar / berat", pattern: /((dp|uang muka).{0,25}(besar|mahal|tinggi|berat|kemahalan|kurang)|(besar|berat|mahal|tinggi).{0,15}(dp|uang muka))/i },
  { key: "cicilan", label: "Cicilan terlalu berat", pattern: /((cicilan|angsuran).{0,25}(besar|berat|mahal|tinggi)|(berat|besar|mahal).{0,15}(cicilan|angsuran))/i },
  { key: "kpr", label: "KPR ditolak / masalah SLIK", pattern: /((slik|bi checking).{0,20}(jelek|buruk|merah|kol|masalah|tidak bersih)|(ditolak|tidak lolos|gagal|reject).{0,20}(kpr|bank|acc|pengajuan)|(kpr|pengajuan).{0,15}(ditolak|gagal|tidak lolos))/i },
  { key: "penghasilan", label: "Penghasilan / slip gaji belum memenuhi", pattern: /((gaji|penghasilan|slip).{0,25}(kurang|tidak cukup|belum cukup|rendah|tidak ada|nggak ada|gak ada)|(tidak|nggak|gak|belum) (punya|ada) (slip|gaji tetap)|freelance)/i },
  { key: "lokasi", label: "Lokasi terlalu jauh / tidak cocok", pattern: /(kejauhan|terlalu jauh|jauh banget|jauh sekali|agak jauh|lumayan jauh|pelosok|terpencil|rawan banjir|banjir)/i },
  { key: "spesifikasi", label: "Ukuran / spesifikasi kurang sesuai", pattern: /(terlalu kecil|kekecilan|sempit|kurang luas|kurang besar|kurang kamar|kamar (nya )?kurang)/i },
  { key: "legalitas", label: "Ragu legalitas / developer / DP hangus", pattern: /(dp hangus|hangus|(ragu|takut|khawatir|was.?was|tidak percaya).{0,30}(sertifikat|legal|developer|penipuan|tipu)|penipuan)/i },
  { key: "pasangan", label: "Perlu diskusi dengan pasangan / keluarga", pattern: /((tanya|diskusi|bicara|rundingan?|musyawarah|izin).{0,20}(suami|istri|pasangan|keluarga|orang ?tua|ortu)|(suami|istri|pasangan|orang ?tua|ortu).{0,20}(belum|tidak|nggak|gak) (setuju|mau|acc))/i },
  { key: "menunda", label: "Belum siap / ingin menunda", pattern: /(belum siap|belum dulu|nanti dulu|nanti saja|pikir.?pikir|dipikir dulu|dipertimbangkan|ditunda|tunda dulu|bulan depan|tahun depan|belum ada dana)/i },
  { key: "lain", label: "Sudah dapat / memilih rumah lain", pattern: /((sudah|udah) (dapat|dapet|beli|booking|punya|ambil) (rumah|unit|yang lain)|sudah ada rumah|cari yang lain|lihat (yang )?lain|pilih (yang )?lain|di tempat lain|perumahan lain|sudah dapat rumah)/i },
  { key: "batal", label: "Menyatakan tidak jadi", pattern: /(tidak jadi|gak jadi|ga jadi|nggak jadi|batal|cancel)/i },
];

export interface ObjectionInput {
  /** Pesan calon pembeli, urut waktu (isi dipakai hanya untuk pencocokan di kode). */
  messages: { leadId: string; at: string; content: string }[];
  temperatureByLead: Map<string, string>;
  /** Batas "baru" (ISO): keberatan yang diucapkan sesudahnya dihitung sebagai 7 hari terakhir. */
  recentSince: string;
  /** Lead dianggap berhenti bila pesan terakhirnya lebih lama dari ini (ISO). */
  silentBefore: string;
}

export interface ObjectionResult {
  metrics: ObjectionMetrics;
  /** Keberatan pada pesan terakhir calon pembeli per lead (untuk daftar tindak lanjut). */
  lastObjectionByLead: Map<string, { label: string; at: string }>;
}

function objectionsOf(content: string): { key: string; label: string }[] {
  return OBJECTIONS.filter((o) => o.pattern.test(content)).map((o) => ({ key: o.key, label: o.label }));
}

/** Label keberatan pertama yang cocok pada satu pesan, atau null. */
export function firstObjectionLabel(content: string): string | null {
  return objectionsOf(content)[0]?.label ?? null;
}

export function computeObjectionMetrics(input: ObjectionInput): ObjectionResult {
  const rowsByKey = new Map<string, { label: string; leads: Set<string>; recent: Set<string> }>();
  const lastCustomerMessage = new Map<string, { at: string; content: string }>();
  const leadsWithChat = new Set<string>();

  for (const m of input.messages) {
    if (!m.content) continue;
    leadsWithChat.add(m.leadId);
    const prev = lastCustomerMessage.get(m.leadId);
    if (!prev || m.at >= prev.at) lastCustomerMessage.set(m.leadId, { at: m.at, content: m.content });
    for (const o of objectionsOf(m.content)) {
      const row = rowsByKey.get(o.key) ?? { label: o.label, leads: new Set<string>(), recent: new Set<string>() };
      row.leads.add(m.leadId);
      if (m.at >= input.recentSince) row.recent.add(m.leadId);
      rowsByKey.set(o.key, row);
    }
  }

  // Berhenti setelah keberatan: pesan terakhir lead memuat keberatan, lalu sepi, dan lead belum Hot/Closing.
  const lastObjectionByLead = new Map<string, { label: string; at: string }>();
  const stoppedByKey = new Map<string, number>();
  for (const [leadId, last] of lastCustomerMessage) {
    const found = objectionsOf(last.content);
    if (found.length === 0) continue;
    lastObjectionByLead.set(leadId, { label: found[0].label, at: last.at });
    if (last.at >= input.silentBefore) continue;
    if (reachedHot(input.temperatureByLead.get(leadId))) continue;
    for (const o of found) stoppedByKey.set(o.key, (stoppedByKey.get(o.key) ?? 0) + 1);
  }

  const rows: ObjectionRow[] = Array.from(rowsByKey.entries())
    .map(([key, row]) => {
      let nowHot = 0;
      let nowColdBatal = 0;
      for (const id of row.leads) {
        const t = input.temperatureByLead.get(id);
        if (reachedHot(t)) nowHot += 1;
        else if (t === "Cold" || t === "Batal") nowColdBatal += 1;
      }
      return {
        label: row.label,
        leads: row.leads.size,
        recent7d: row.recent.size,
        nowHot,
        nowColdBatal,
        stoppedAfter: stoppedByKey.get(key) ?? 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);

  return {
    metrics: { leadsAnalyzed: leadsWithChat.size, rows },
    lastObjectionByLead,
  };
}
