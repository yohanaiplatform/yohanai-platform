// src/lib/analysis/topics.ts

import type { TopicLiftRow, TopicMetrics } from "@/lib/analysis/types";

/**
 * Kamus topik pertanyaan calon pembeli (pencocokan kata kunci di KODE, bukan LLM, supaya angka bisa diperiksa).
 * "Survey/lihat lokasi" SENGAJA tidak ada: AI menaikkan lead ke Hot justru ketika lead mengatur survey, jadi topik itu
 * menentukan definisi Hot dan akan membuat perbandingan menyesatkan (berputar).
 */
export const TOPICS: { key: string; label: string; pattern: RegExp }[] = [
  { key: "dp", label: "DP / uang muka", pattern: /\b(dp|uang muka|down ?payment|tanda jadi)\b/i },
  { key: "harga", label: "Harga / nego", pattern: /\b(harga|price|nego|termurah|murah)\b/i },
  { key: "angsuran", label: "Angsuran / cicilan", pattern: /\b(angsuran|cicilan|cicil|tenor|perbulan|per bulan)\b/i },
  { key: "kpr", label: "KPR / bank / syarat", pattern: /\b(kpr|bank|btn|bsn|slik|plafon|gaji|penghasilan|slip|bi checking)\b/i },
  { key: "subsidi", label: "Subsidi", pattern: /\b(subsidi|fllp|sejahtera)\b/i },
  { key: "lokasi", label: "Lokasi / alamat / jarak", pattern: /\b(lokasi|alamat|jarak|dekat|maps|share ?loc|daerah|wilayah|kawasan)\b/i },
  { key: "fasilitas", label: "Fasilitas sekitar", pattern: /\b(sekolah|kampus|untan|rumah sakit|pasar|mall|bandara|tol)\b/i },
  { key: "media", label: "Foto / video / denah", pattern: /\b(foto|poto|video|gambar|denah|penampakan)\b/i },
  { key: "tipe", label: "Tipe / ukuran / kamar", pattern: /\b(tipe|type|luas|kamar|ukuran)\b/i },
  { key: "legalitas", label: "Legalitas (sertifikat/IMB)", pattern: /\b(sertifikat|shm|shgb|imb|pbg|legal|akta|ajb|bphtb)\b/i },
  { key: "promo", label: "Promo / bonus", pattern: /\b(promo|bonus|gratis|diskon)\b/i },
  { key: "stok", label: "Ketersediaan unit", pattern: /\b(ready|tersedia|stok|stock|sisa|indent|unit)\b/i },
  { key: "booking", label: "Booking / pesan unit", pattern: /\b(booking|pesan unit|panjar)\b/i },
];

export const MIN_TOPIC_GROUP = 10;

export interface TopicInput {
  /** Pesan calon pembeli (isi dipakai hanya untuk pencocokan di kode, tidak keluar dari fungsi ini). */
  messages: { leadId: string; at: string; content: string }[];
  /** Temperature saat ini per lead. */
  temperatureByLead: Map<string, string>;
  /** Perpindahan nyata ke Hot (from tidak null): lead + waktu. */
  hotTransitions: { leadId: string; at: string }[];
}

export function reachedHot(temperature: string | undefined): boolean {
  return temperature === "Hot" || Boolean(temperature?.startsWith("Closing")) || temperature === "Booking";
}

function topicsOf(content: string): string[] {
  return TOPICS.filter((t) => t.pattern.test(content)).map((t) => t.key);
}

/**
 * Pemicu naik Hot dari isi percakapan: bandingkan, per topik, proporsi lead yang mencapai Hot (Hot/Closing/Booking) antara
 * yang pernah menanyakan topik itu dan yang tidak. Hanya korelasi (bukan sebab-akibat), dan selalu menyertakan jumlah sampel.
 */
export function computeTopicMetrics(input: TopicInput): TopicMetrics {
  const topicsByLead = new Map<string, Set<string>>();
  for (const m of input.messages) {
    if (!m.content) continue;
    const set = topicsByLead.get(m.leadId) ?? new Set<string>();
    for (const key of topicsOf(m.content)) set.add(key);
    topicsByLead.set(m.leadId, set);
  }

  const analyzedLeads = Array.from(topicsByLead.keys()).filter((id) => input.temperatureByLead.has(id));
  const hotLeads = analyzedLeads.filter((id) => reachedHot(input.temperatureByLead.get(id))).length;

  const rows: TopicLiftRow[] = TOPICS.map((t) => {
    let withLeads = 0;
    let withHot = 0;
    let withoutLeads = 0;
    let withoutHot = 0;
    for (const id of analyzedLeads) {
      const hot = reachedHot(input.temperatureByLead.get(id));
      if (topicsByLead.get(id)?.has(t.key)) {
        withLeads += 1;
        if (hot) withHot += 1;
      } else {
        withoutLeads += 1;
        if (hot) withoutHot += 1;
      }
    }
    return {
      label: t.label,
      withLeads,
      withHot,
      withoutLeads,
      withoutHot,
      enough: withLeads >= MIN_TOPIC_GROUP && withoutLeads >= MIN_TOPIC_GROUP,
    };
  })
    .filter((r) => r.withLeads > 0)
    .sort((a, b) => b.withLeads - a.withLeads);

  // Topik yang sudah disebut lead SEBELUM naik ke Hot (sampel kecil: hanya perpindahan sejak riwayat dicatat).
  const beforeCounts = new Map<string, number>();
  const seenLeads = new Set<string>();
  for (const tr of input.hotTransitions) {
    if (seenLeads.has(tr.leadId)) continue;
    seenLeads.add(tr.leadId);
    const keys = new Set<string>();
    for (const m of input.messages) {
      if (m.leadId !== tr.leadId || m.at > tr.at) continue;
      for (const key of topicsOf(m.content)) keys.add(key);
    }
    for (const key of keys) beforeCounts.set(key, (beforeCounts.get(key) ?? 0) + 1);
  }
  const labelOf = new Map(TOPICS.map((t) => [t.key, t.label]));
  const beforeHot = Array.from(beforeCounts.entries())
    .map(([key, count]) => ({ label: labelOf.get(key) ?? key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    leadsAnalyzed: analyzedLeads.length,
    hotLeads,
    minGroup: MIN_TOPIC_GROUP,
    rows,
    beforeHot,
    beforeHotSample: seenLeads.size,
  };
}
