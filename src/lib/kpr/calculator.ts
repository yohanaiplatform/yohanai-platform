// src/lib/kpr/calculator.ts

/**
 * Kalkulator simulasi KPR -- fungsi murni (tanpa "use client"), dipakai server (AI Agent)
 * DAN komponen client (halaman listing). JANGAN suruh LLM berhitung sendiri; hitung di sini.
 *
 * Aturan (dari Yohan, 2-3 Okt 2026; semuanya SIMULASI, keputusan akhir ada di bank):
 * - SUBSIDI (FLPP): bunga & angsuran sama di seluruh Indonesia (keputusan pemerintah).
 *   Faktor angsuran diturunkan dari tabel Bank BSN (plafon Rp176.180.000):
 *   10 th Rp1.901.000, 15 th Rp1.414.500, 20 th Rp1.178.100 per bulan. Angsuran sebanding dengan
 *   plafon, jadi berlaku untuk harga/DP berapa pun.
 *   Plafon = harga - DP konsumen - bantuan DP pemerintah (Rp4 juta). DP minimal 1% dari harga.
 * - NON-SUBSIDI: DP minimal 10%, tanpa bantuan Rp4 juta, plafon = harga - DP, anuitas bunga 7%
 *   (asumsi tertinggi, tetap 3 tahun pertama; setelah itu mengambang -- tidak bisa diperkirakan).
 * - Tenor 10/15/20 tahun.
 */

export const KPR_TENORS_YEARS = [10, 15, 20] as const;

export const SUBSIDI_DP_ASSISTANCE = 4_000_000;
export const SUBSIDI_MIN_DP_RATIO = 0.01;
export const NON_SUBSIDI_MIN_DP_RATIO = 0.1;
export const NON_SUBSIDI_ANNUAL_RATE = 0.07;

/** Tabel acuan Bank BSN (angsuran per bulan untuk plafon BSN_REFERENCE_PRINCIPAL). */
const BSN_REFERENCE_PRINCIPAL = 176_180_000;
const BSN_REFERENCE_INSTALLMENT: Record<number, number> = {
  10: 1_901_000,
  15: 1_414_500,
  20: 1_178_100,
};

export interface KprInstallment {
  tenorYears: number;
  monthly: number;
}

export interface KprScenario {
  principal: number;
  minDp: number;
  dpTooLow: boolean;
  installments: KprInstallment[];
}

function roundToHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

/** Angsuran anuitas bulanan klasik. */
export function annuityMonthly(principal: number, annualRate: number, years: number): number {
  const months = years * 12;
  const r = annualRate / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function calculateSubsidi(price: number, dp: number): KprScenario {
  const minDp = Math.round(price * SUBSIDI_MIN_DP_RATIO);
  const principal = Math.max(0, price - dp - SUBSIDI_DP_ASSISTANCE);
  const installments = KPR_TENORS_YEARS.map((years) => ({
    tenorYears: years,
    monthly: roundToHundred((principal * BSN_REFERENCE_INSTALLMENT[years]) / BSN_REFERENCE_PRINCIPAL),
  }));
  return { principal, minDp, dpTooLow: dp < minDp, installments };
}

export function calculateNonSubsidi(price: number, dp: number): KprScenario {
  const minDp = Math.round(price * NON_SUBSIDI_MIN_DP_RATIO);
  const principal = Math.max(0, price - dp);
  const installments = KPR_TENORS_YEARS.map((years) => ({
    tenorYears: years,
    monthly: roundToHundred(annuityMonthly(principal, NON_SUBSIDI_ANNUAL_RATE, years)),
  }));
  return { principal, minDp, dpTooLow: dp < minDp, installments };
}

/** Cash tempo: DP awal lalu sisa dicicil tanpa bunga selama `months` bulan (maks 12 menurut Yohan). */
export function calculateCashTempo(price: number, dp: number, months = 12): { remaining: number; monthly: number } {
  const remaining = Math.max(0, price - dp);
  return { remaining, monthly: roundToHundred(remaining / months) };
}

export function formatRupiahShort(value: number): string {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

/** Listing dianggap subsidi kalau tag/judul/deskripsi menyebut "subsidi". */
export function isSubsidiListing(input: { aiTags?: string[]; title?: string | null; description?: string | null }): boolean {
  const haystack = [...(input.aiTags ?? []), input.title ?? "", input.description ?? ""].join(" ").toLowerCase();
  return haystack.includes("subsidi");
}

/**
 * Ambil nominal DP dari teks bebas lead, mis. "dp 30jt", "DP 25 juta", "uang muka 20.000.000",
 * "dp nya 15 jt aja". Return rupiah, atau null kalau tidak ada angka DP yang jelas.
 */
export function parseDpFromText(text: string): number | null {
  const lower = text.toLowerCase();
  const match = lower.match(/(?:\bdp\b|uang muka|\bdp-?nya\b)[^\d]{0,12}(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(juta|jt|rb|ribu|k)?/);
  if (!match) return null;

  const rawNumber = match[1];
  const unit = match[2];
  let value: number;

  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(rawNumber)) {
    value = Number(rawNumber.replace(/[.,]/g, ""));
  } else {
    value = Number(rawNumber.replace(",", "."));
  }
  if (!Number.isFinite(value)) return null;

  if (unit === "juta" || unit === "jt") value *= 1_000_000;
  else if (unit === "rb" || unit === "ribu" || unit === "k") value *= 1_000;
  else if (value < 1000) value *= 1_000_000; // "dp 30" tanpa satuan -> anggap juta

  return value >= 500_000 ? Math.round(value) : null;
}

/**
 * Teks simulasi untuk disisipkan ke konteks AI Agent (angka final dari kode -- AI hanya
 * menyampaikan). Kembalikan null kalau harga/DP tidak valid.
 */
export function buildKprSimulationText(input: {
  listingTitle: string;
  price: number | null;
  dp: number;
  /** Tampilkan skenario subsidi (listing subsidi DAN lead tidak khusus menanyakan non-subsidi). */
  subsidi: boolean;
  /** DP diambil dari DP minimal karena lead belum menyebut nominal DP. */
  dpIsMinimum?: boolean;
}): string | null {
  const { price, dp } = input;
  if (!price || price <= 0 || dp <= 0 || dp >= price) return null;

  const lines = [
    `Listing: ${input.listingTitle}, harga ${formatRupiahShort(price)}, ${
      input.dpIsMinimum
        ? `DP dihitung dari DP MINIMAL ${formatRupiahShort(dp)} (lead belum menyebut nominal DP; DP minimal non-subsidi 10%, sifatnya pengajuan karena bank menilai ulang kualitas kredit)`
        : `DP yang dibahas lead ${formatRupiahShort(dp)}`
    }.`,
  ];

  const describe = (label: string, scenario: KprScenario, note: string) => {
    lines.push(
      `${label} (plafon ${formatRupiahShort(scenario.principal)}${note}): ` +
        scenario.installments.map((i) => `${i.tenorYears} th ${formatRupiahShort(i.monthly)}/bln`).join(", ") +
        (scenario.dpTooLow ? ` -- DP DI BAWAH MINIMAL (${formatRupiahShort(scenario.minDp)}), sampaikan DP minimal itu.` : "")
    );
  };

  if (input.subsidi) describe("KPR SUBSIDI", calculateSubsidi(price, dp), "");
  describe("KPR NON-SUBSIDI", calculateNonSubsidi(price, dp), ", bunga tertinggi masa promo flat minimal 3 th (asumsi 7%) lalu mengambang sesuai bank");

  return lines.join("\n");
}
