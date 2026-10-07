// src/lib/reports/getAnthropicBilling.ts

/**
 * Biaya ASLI dari Anthropic (Usage & Cost Admin API, /v1/organizations/cost_report) -- angka yang sama
 * dengan halaman Cost di Claude Console. Butuh env ANTHROPIC_ADMIN_API_KEY (Admin API key, beda dari
 * ANTHROPIC_API_KEY). Gagal/tanpa key -> available:false + alasan, laporan tetap jalan dengan estimasi.
 *
 * Catatan: ini biaya SELURUH organisasi Console (semua key/workspace), bukan hanya aplikasi ini; hari
 * dipotong per hari UTC (Anthropic), jadi "kemarin" bergeser ~7 jam dari hari WIB.
 */

const BASE = "https://api.anthropic.com/v1/organizations/cost_report";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AnthropicBillingLine {
  description: string;
  usd: number;
}

export interface AnthropicBilling {
  available: boolean;
  error: string | null;
  /** Hari UTC terakhir yang lengkap (tanggal YYYY-MM-DD). */
  lastDayLabel: string | null;
  lastDayUsd: number;
  weekUsd: number;
  monthUsd: number;
  /** Rincian biaya bulan ini per jenis (model + jenis token), terbesar dulu. */
  monthLines: AnthropicBillingLine[];
}

interface CostBucket {
  starting_at: string;
  ending_at: string;
  results: { amount: string; description: string | null }[];
}

const empty = (error: string): AnthropicBilling => ({
  available: false,
  error,
  lastDayLabel: null,
  lastDayUsd: 0,
  weekUsd: 0,
  monthUsd: 0,
  monthLines: [],
});

function startOfUtcDay(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS;
}

export async function getAnthropicBilling(now = new Date()): Promise<AnthropicBilling> {
  const key = process.env.ANTHROPIC_ADMIN_API_KEY;
  if (!key) return empty("ANTHROPIC_ADMIN_API_KEY belum dikonfigurasi.");

  const todayStart = startOfUtcDay(now.getTime());
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const from = Math.min(monthStart, todayStart - 7 * DAY_MS);

  const buckets: CostBucket[] = [];
  let page: string | null = null;
  try {
    for (let i = 0; i < 5; i++) {
      const params = new URLSearchParams({
        starting_at: new Date(from).toISOString(),
        ending_at: new Date(todayStart).toISOString(),
        bucket_width: "1d",
        limit: "31",
      });
      params.append("group_by[]", "description");
      if (page) params.set("page", page);

      const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "User-Agent": "YohanAI-Platform/1.0 (https://yohanai.id)",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        return empty(`Anthropic Admin API ${res.status}: ${body}`);
      }
      const json = (await res.json()) as { data?: CostBucket[]; has_more?: boolean; next_page?: string | null };
      buckets.push(...(json.data ?? []));
      if (!json.has_more || !json.next_page) break;
      page = json.next_page;
    }
  } catch (err) {
    return empty(err instanceof Error ? err.message : "Gagal menghubungi Anthropic Admin API");
  }

  const usdOf = (b: CostBucket) => b.results.reduce((sum, r) => sum + Number(r.amount || 0), 0) / 100;
  const weekFrom = todayStart - 7 * DAY_MS;

  let weekUsd = 0;
  let monthUsd = 0;
  const lines = new Map<string, number>();
  for (const b of buckets) {
    const startMs = new Date(b.starting_at).getTime();
    const usd = usdOf(b);
    if (startMs >= weekFrom) weekUsd += usd;
    if (startMs >= monthStart) {
      monthUsd += usd;
      for (const r of b.results) {
        const name = r.description ?? "(lainnya)";
        lines.set(name, (lines.get(name) ?? 0) + Number(r.amount || 0) / 100);
      }
    }
  }

  const last = buckets.length > 0 ? buckets[buckets.length - 1] : null;
  return {
    available: true,
    error: null,
    lastDayLabel: last ? last.starting_at.slice(0, 10) : null,
    lastDayUsd: last ? usdOf(last) : 0,
    weekUsd,
    monthUsd,
    monthLines: [...lines.entries()]
      .map(([description, usd]) => ({ description, usd }))
      .sort((a, b) => b.usd - a.usd)
      .slice(0, 6),
  };
}
