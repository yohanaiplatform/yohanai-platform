// src/lib/documents/kwitansiTypes.ts
//
// Tipe formulir Kwitansi Booking Unit. File polos (server + client). Data penerima (agen/perusahaan/rekening) memakai
// isian tetap yang sama dengan MoU (property.document_settings, lihat mouTypes.MouParty2).

import type { MouParty2 } from "@/lib/documents/mouTypes";

export type PurchaseMethod = "KPR" | "Cash" | "Cash Bertahap";

export const PURCHASE_METHODS: PurchaseMethod[] = ["KPR", "Cash", "Cash Bertahap"];

/** Untuk pembayaran apa kwitansi ini. "Lainnya" memakai teks bebas (purposeCustom). */
export const PAYMENT_PURPOSES = ["Booking", "Angsuran Booking", "Angsuran Cash", "Angsuran Cash Bertahap", "Lainnya"] as const;

/** Teks tujuan pembayaran yang tercetak (judul bawah header + baris "Untuk pembayaran"). */
export function purposeLabel(payment: { purpose: string; purposeCustom?: string }): string {
  if (payment.purpose === "Lainnya") return payment.purposeCustom?.trim() || "Lainnya";
  return payment.purpose || "Booking";
}

const toNumber = (v: string | number | null | undefined) => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;

/**
 * Hitung sisa pembayaran booking:
 * - KPR / Cash Bertahap: Total DP dikurangi uang booking (mis. Total DP 10 juta, booking 2 juta, sisa 8 juta).
 * - Cash: harga unit dikurangi uang booking.
 * - Pembayaran lanjutan (angsuran): ikut dikurangi "sudah dibayar sebelumnya" bila diisi.
 * base = angka acuan (0 kalau belum diisi), remaining = null kalau acuan belum ada.
 */
export function computeBookingBalance(unit: { price: string; purchaseMethod?: PurchaseMethod; totalDp?: string }, amount: string | number, previouslyPaid: string | number = 0) {
  const method: PurchaseMethod = unit.purchaseMethod ?? "Cash";
  const usesDp = method !== "Cash";
  const base = usesDp ? toNumber(unit.totalDp) : toNumber(unit.price);
  const paid = toNumber(amount);
  const before = toNumber(previouslyPaid);
  return { method, usesDp, base, paid, before, remaining: base > 0 ? Math.max(0, base - before - paid) : null, overpaid: base > 0 && before + paid > base };
}

export interface KwitansiForm {
  buyer: {
    name: string;
    phone: string;
    address: string;
  };
  unit: {
    projectName: string;
    unitLabel: string;
    type: string;
    price: string;
    /** Cara membeli: KPR / Cash / Cash Bertahap. KPR dan Cash Bertahap memakai Total DP; Cash langsung dari harga unit. */
    purchaseMethod: PurchaseMethod;
    /** Total DP yang disepakati (hanya KPR / Cash Bertahap). */
    totalDp: string;
  };
  payment: {
    amount: string;
    /** Salah satu PAYMENT_PURPOSES (kwitansi lama bisa berisi teks bebas -> dibaca sebagai Lainnya). */
    purpose: string;
    purposeCustom: string;
    /** Total yang sudah dibayar sebelumnya (angsuran lanjutan), opsional. */
    previouslyPaid: string;
    method: "Transfer" | "Tunai" | "Lainnya";
    date: string;
    notes: string;
  };
  party2: MouParty2;
  signPlace: string;
}

export interface KwitansiListingInfo {
  title: string;
}
