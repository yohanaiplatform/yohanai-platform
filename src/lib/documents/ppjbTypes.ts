// src/lib/documents/ppjbTypes.ts
//
// Tipe, klausul standar, dan pengganti token untuk PPJB (Perjanjian Pengikatan Jual Beli). File polos (server + client).
// Klausul standar disalin dari PPJB Kapur Mas Residence yang dipakai Yohan; semuanya bisa diubah/ditambah/dihapus per dokumen.
// TIDAK ADA data bisnis yang di-hardcode selain teks klausul default itu (yang ikut diedit pengguna).

import { computeBookingBalance, type PurchaseMethod } from "@/lib/documents/kwitansiTypes";
import type { MouParty2 } from "@/lib/documents/mouTypes";
import { terbilangRupiah } from "@/lib/documents/terbilang";

export interface PpjbPerson {
  name: string;
  birthPlace: string;
  /** ISO yyyy-mm-dd, kosong kalau belum diisi. */
  birthDate: string;
  address: string;
  idNumber: string;
  phone: string;
}

export interface PpjbForm {
  docNumberProject: string;
  buyer: PpjbPerson;
  seller: PpjbPerson & { company: string };
  property: {
    kind: string;
    type: string;
    complexName: string;
    unitNo: string;
    address: string;
    shmNumber: string;
    price: string;
    booking: string;
    method: PurchaseMethod;
    totalDp: string;
    facilities: string;
    paymentReceiver: string;
  };
  clauses: string[];
  /** True kalau pengguna sudah mengubah daftar klausul (jangan ditimpa saat metode pembayaran diganti). */
  clausesEdited: boolean;
  footnote: string;
  signPlace: string;
  signDate: string;
  party2: MouParty2;
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export const romanMonth = (monthIndex0: number) => ROMAN[monthIndex0] ?? "I";

/** 1999-05-19 -> "19 Mei 1999" */
export function formatLongDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ""} ${m[1]}`;
}

/** "Sungai Raya" + 1999-05-19 -> "Sungai Raya, 19 Mei 1999" */
export function formatBirthLong(place: string, iso: string): string {
  return [place.trim(), formatLongDate(iso)].filter(Boolean).join(", ");
}

const titleCase = (s: string) => s.replace(/\b([a-z])/g, (c) => c.toUpperCase());

/** 2000000 -> "Rp 2.000.000 (Dua Juta Rupiah)" */
export function rupiahWithWords(value: string | number): string {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "Rp ......";
  return `Rp ${Math.round(n).toLocaleString("id-ID")} (${titleCase(terbilangRupiah(n))})`;
}

/** Klausul standar (dari PPJB Kapur Mas). Token: {{booking}} {{sisa}} {{total_dp}} {{harga}} {{penerima}} {{fasilitas}} */
export const STANDARD_CLAUSES: Record<string, string> = {
  booking: "Pembeli membayar Uang Tanda Jadi / Booking sebesar {{booking}} kepada Penjual yang dibayarkan langsung ke rekening {{penerima}}.",
  sisaDp: "Uang Tanda Jadi / booking sudah termasuk kedalam uang muka yang sisanya akan dilunasi sebelum proses Akad sebesar {{sisa}}.",
  sisaCash: "Uang Tanda Jadi / booking sudah termasuk kedalam harga unit yang sisanya akan dilunasi sebelum proses Akad sebesar {{sisa}}.",
  fasilitas: "Developer memberi fasilitas ekstra tambahan : {{fasilitas}}",
  blokir: "Konsumen akan dibebankan selisih biaya blokir angsuran untuk permintaan KPR 15 tahun kebawah (**)",
  plafond: "Pembeli setuju bahwa jika Plafond kredit yang dicairkan oleh bank dibawah dari yang diajukan maka pembeli akan membayar tambahan selisih kekurangan uang muka.",
  berkas: "Pembeli setuju untuk melengkapi berkas persyaratan KPR yang dibutuhkan oleh bank selambat-lambatnya 14 hari setelah menandatangani PPJB.",
  flpp: "Pembeli setuju jika pengajuan fasilitas subsidi (FLPP) ditolak akan mengajukan KPR Non-Subsidi.",
  kprDitolak: "Pembeli setuju bahwa bila pengajuan KPR tidak disetujui oleh bank, maka uang muka yang sudah disetorkan akan dikembalikan dengan potongan 50% dari dana yang telah disetorkan",
  batal: "Pembeli setuju bahwa jika pembeli menyatakan membatalkan jual beli saat proses pengajuan KPR / Proses Notaris maka uang tanda jadi yang dibayarkan akan menjadi hangus sepenuhnya.",
  batalCash: "Pembeli setuju bahwa jika pembeli menyatakan membatalkan jual beli maka uang tanda jadi yang dibayarkan akan menjadi hangus sepenuhnya.",
  bangunan: "Pembeli setuju untuk menyerahkan pembangunan tambahan dari bangunan awal kepada developer, guna pengendalian kualitas bangunan dan sanitasi kompleks.",
};

/** Daftar klausul awal menurut metode pembayaran (bisa diubah penuh oleh pengguna). */
export function defaultClauses(method: PurchaseMethod): string[] {
  const s = STANDARD_CLAUSES;
  if (method === "KPR") return [s.booking, s.sisaDp, s.fasilitas, s.blokir, s.plafond, s.berkas, s.flpp, s.kprDitolak, s.batal, s.bangunan];
  if (method === "Cash Bertahap") return [s.booking, s.sisaDp, s.fasilitas, s.batalCash, s.bangunan];
  return [s.booking, s.sisaCash, s.fasilitas, s.batalCash, s.bangunan];
}

/** Ganti token klausul dengan nilai dari formulir. */
export function renderClause(text: string, form: PpjbForm): string {
  const p = form.property;
  const balance = computeBookingBalance({ price: p.price, purchaseMethod: p.method, totalDp: p.totalDp }, p.booking);
  const sisa = balance.remaining !== null ? rupiahWithWords(balance.remaining) : "Rp ......";
  const map: Record<string, string> = {
    booking: rupiahWithWords(p.booking),
    sisa,
    total_dp: balance.usesDp && balance.base > 0 ? rupiahWithWords(balance.base) : "Rp ......",
    harga: rupiahWithWords(p.price),
    penerima: p.paymentReceiver || "......",
    fasilitas: p.facilities || "......",
  };
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, key: string) => map[key] ?? whole);
}
