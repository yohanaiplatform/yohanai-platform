// src/lib/analysis/types.ts

export interface CountItem {
  label: string;
  count: number;
}

export interface SourceRow {
  label: string;
  leads: number;
  hotWarm: number;
  hot: number;
  closing: number;
  /** Sampel cukup (>= MIN_SOURCE_SAMPLE lead) untuk dibandingkan antar sumber. */
  enough: boolean;
}

export interface TopicLiftRow {
  label: string;
  /** Lead yang pernah menanyakan topik ini / dari mereka yang mencapai Hot (Hot, Closing, Booking). */
  withLeads: number;
  withHot: number;
  /** Lead yang tidak menanyakan topik ini / dari mereka yang mencapai Hot. */
  withoutLeads: number;
  withoutHot: number;
  /** Kedua kelompok >= minGroup lead, cukup untuk dibandingkan. */
  enough: boolean;
}

export interface TopicMetrics {
  leadsAnalyzed: number;
  hotLeads: number;
  minGroup: number;
  rows: TopicLiftRow[];
  /** Topik yang sudah disebut lead sebelum naik ke Hot (sampel kecil). */
  beforeHot: CountItem[];
  beforeHotSample: number;
}

export interface AnalysisMetrics {
  periodStart: string;
  periodEnd: string;
  days: number;
  funnel: {
    total: number;
    current: CountItem[];
    /** Perubahan Temperature dalam periode, mis. "Cold > Warm". */
    transitions: CountItem[];
    transitionsAuto: number;
    transitionsManual: number;
    /** Median jam dari lead dibuat sampai pertama kali Hot (seluruh riwayat), null bila belum ada data. */
    medianHoursToHot: number | null;
    hotSample: number;
    /** Lead Hot/Warm yang punya percakapan tetapi tidak ada pesan >= STALLED_DAYS hari. */
    stalledHotWarm: number;
    hotWarmWithChat: number;
  };
  sources: {
    cohortDays: number;
    cohortLeads: number;
    minSample: number;
    rows: SourceRow[];
  };
  /** Pemicu naik Hot dari isi percakapan; tidak ada di laporan lama. */
  topics?: TopicMetrics;
  /** Keberatan calon pembeli; tidak ada di laporan lama. */
  objections?: ObjectionMetrics;
  /** Permintaan lokasi vs stok listing; tidak ada di laporan lama. */
  demand?: DemandMetrics;
  /** Alasan Batal/Closing yang dicatat agen; tidak ada di laporan lama. */
  reasons?: ReasonMetrics;
  ai: {
    runs: number;
    success: number;
    errors: number;
    leadsHandled: number;
    confidence: { high: number; medium: number; low: number };
    replySent: number;
    followUpNotes: number;
    messagesFromCustomer: number;
    messagesFromAgent: number;
    /** Percakapan Hot/Warm yang pesan terakhirnya dari calon pembeli dan belum dibalas >= UNANSWERED_HOURS jam. */
    unansweredHotWarm: number;
  };
}

export interface AnalysisFinding {
  title: string;
  detail: string;
  action: string | null;
}

export const MIN_SOURCE_SAMPLE = 10;
export const STALLED_DAYS = 5;
export const UNANSWERED_HOURS = 2;

export interface ObjectionRow {
  label: string;
  /** Lead yang pernah menyatakan keberatan ini (seluruh riwayat chat). */
  leads: number;
  /** Dari mereka, yang mengucapkannya dalam 7 hari terakhir. */
  recent7d: number;
  /** Dari mereka, yang kini Hot/Closing/Booking atau Cold/Batal. */
  nowHot: number;
  nowColdBatal: number;
  /** Lead yang pesan terakhirnya memuat keberatan ini, lalu sepi > STALLED_DAYS hari dan belum Hot. */
  stoppedAfter: number;
}

export interface ObjectionMetrics {
  leadsAnalyzed: number;
  rows: ObjectionRow[];
}

/**
 * Lead yang layak ditindaklanjuti. SENGAJA terpisah dari AnalysisMetrics: memuat nama lead, jadi TIDAK PERNAH dikirim ke LLM;
 * hanya ditampilkan di email pemilik dan Master Admin.
 */
export interface FollowUpLead {
  leadId: string;
  slug: string | null;
  name: string;
  temperature: string;
  kind: "waiting" | "stalled" | "objection";
  /** Waktu pesan terakhir (ISO). */
  lastAt: string;
  /** Keberatan pada pesan terakhir calon pembeli, bila ada. */
  objection: string | null;
}

export interface FollowUpList {
  waiting: FollowUpLead[];
  stalled: FollowUpLead[];
  objection: FollowUpLead[];
  totals: { waiting: number; stalled: number; objection: number };
}

export const FOLLOW_UP_LIST_LIMIT = 12;

export interface DemandRow {
  label: string;
  /** Lead yang menyebut area ini sebagai minat (seluruh riwayat) / dibuat 30 hari terakhir / kini Hot atau Warm. */
  leads: number;
  leads30: number;
  hotWarm: number;
  /** Listing tersedia (tidak disembunyikan) di area ini. */
  stock: number;
  /** Permintaan 30 hari >= minDemandForGap tetapi stok 0. */
  gap: boolean;
  /** Stok 0 dan permintaan sepanjang riwayat >= minHistoricDemand (permintaan lama, mungkin proyek yang sudah habis). */
  historicGap: boolean;
}

export interface DemandMetrics {
  leadsWithInterest: number;
  /** Lead yang menjawab "belum tahu / tidak jelas" -- tidak dihitung sebagai permintaan. */
  undecided: number;
  rows: DemandRow[];
  /** Istilah minat yang belum terpetakan ke area mana pun (dasar menambah kamus). */
  unmapped: CountItem[];
  minDemandForGap: number;
  minHistoricDemand: number;
}

export interface ReasonMetrics {
  batalTotal: number;
  batalWithReason: number;
  closingTotal: number;
  closingWithReason: number;
  batal: CountItem[];
  closing: CountItem[];
}
