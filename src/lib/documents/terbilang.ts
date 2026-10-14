// src/lib/documents/terbilang.ts
//
// Angka -> kata dalam bahasa Indonesia ("Lima juta rupiah"). Fungsi murni, dipakai kwitansi/PPJB.

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function words(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${words(n - 10)} belas`;
  if (n < 100) return `${words(Math.floor(n / 10))} puluh${n % 10 ? ` ${words(n % 10)}` : ""}`;
  if (n < 200) return `seratus${n - 100 ? ` ${words(n - 100)}` : ""}`;
  if (n < 1000) return `${words(Math.floor(n / 100))} ratus${n % 100 ? ` ${words(n % 100)}` : ""}`;
  if (n < 2000) return `seribu${n - 1000 ? ` ${words(n - 1000)}` : ""}`;
  if (n < 1_000_000) return `${words(Math.floor(n / 1000))} ribu${n % 1000 ? ` ${words(n % 1000)}` : ""}`;
  if (n < 1_000_000_000) return `${words(Math.floor(n / 1_000_000))} juta${n % 1_000_000 ? ` ${words(n % 1_000_000)}` : ""}`;
  if (n < 1_000_000_000_000) return `${words(Math.floor(n / 1_000_000_000))} miliar${n % 1_000_000_000 ? ` ${words(n % 1_000_000_000)}` : ""}`;
  return `${words(Math.floor(n / 1_000_000_000_000))} triliun${n % 1_000_000_000_000 ? ` ${words(n % 1_000_000_000_000)}` : ""}`;
}

/** 5000000 -> "Lima juta rupiah". 0/tidak valid -> "". */
export function terbilangRupiah(value: number | string): string {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  const text = `${words(Math.floor(n))} rupiah`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
