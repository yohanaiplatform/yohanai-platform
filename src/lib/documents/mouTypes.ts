// src/lib/documents/mouTypes.ts
//
// Tipe + nilai awal formulir dokumen perjanjian (MoU Pemasaran). File polos (tanpa "use client") supaya bisa dipakai
// server maupun client. Tidak ada data satu bisnis yang di-hardcode di sini: isian Pihak 2 dibaca dari
// property.document_settings per pengguna.

export interface MouParty2 {
  agentName: string;
  officeName: string;
  companyName: string;
  officeAddress: string;
  principalName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  officeEmail: string;
  /** Awalan Listing ID, mis. "GDI" -> GDI/2026/12. */
  listingPrefix: string;
  serviceArea: string;
}

export interface MouForm {
  owner: {
    name: string;
    birthInfo: string;
    address: string;
    occupation: string;
    idNumber: string;
    phone: string;
  };
  party2: MouParty2;
  property: {
    type: string;
    units: string;
    offer: "Dijual" | "Disewakan";
    location: string;
    certificate: string;
    certificateNumber: string;
    price: string;
    commissionPct: string;
    commissionNominal: string;
    closingFee: string;
  };
  agreement: {
    kind: "NON-EKSKLUSIF" | "EKSKLUSIF";
    months: string;
    signPlace: string;
    signDate: string;
    banner: "YA" | "TIDAK";
    documents: string;
    extraInfo: string;
  };
}

/** Data listing yang ikut dicetak di lampiran (snapshot dari listing saat dokumen dibuat). */
export interface MouListingInfo {
  title: string;
  description: string | null;
  landArea: number | null;
  buildingArea: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  carport: number | null;
  photoUrls: string[];
}

export const EMPTY_PARTY2: MouParty2 = {
  agentName: "",
  officeName: "",
  companyName: "",
  officeAddress: "",
  principalName: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  officeEmail: "",
  listingPrefix: "GDI",
  serviceArea: "",
};

export function parseParty2(raw: unknown): MouParty2 {
  const o = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const str = (k: keyof MouParty2) => (typeof o[k] === "string" ? (o[k] as string) : EMPTY_PARTY2[k]);
  return {
    agentName: str("agentName"),
    officeName: str("officeName"),
    companyName: str("companyName"),
    officeAddress: str("officeAddress"),
    principalName: str("principalName"),
    bankName: str("bankName"),
    accountNumber: str("accountNumber"),
    accountName: str("accountName"),
    officeEmail: str("officeEmail"),
    listingPrefix: str("listingPrefix") || "GDI",
    serviceArea: str("serviceArea"),
  };
}

/** Rp 300.000.000 */
export function rupiah(value: string | number | null | undefined): string {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n) || n === 0) return "Rp. ";
  return `Rp. ${Math.round(n).toLocaleString("id-ID")}`;
}

/** 2026-10-14 -> 14/10/2026 */
export function formatSignDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
