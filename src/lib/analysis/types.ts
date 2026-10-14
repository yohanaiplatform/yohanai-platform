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
