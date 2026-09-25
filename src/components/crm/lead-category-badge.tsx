// src/components/crm/lead-category-badge.tsx

import { Badge } from "@/components/ui/badge";

// Kategori itu nama project/property (lihat LEAD_KATEGORI_OPTIONS,
// hardcode dari opsi Google Form -- bisa berubah/bertambah tanpa kode
// ini ikut diubah). Warna di-hash dari teksnya sendiri, bukan mapping
// tetap per nama, supaya kategori baru otomatis dapat warna yang stabil
// (nama yang sama selalu dapat warna yang sama) tanpa perlu disentuh.
const PALETTE = [
  "border-sky-500/40 text-sky-600 dark:text-sky-400",
  "border-violet-500/40 text-violet-600 dark:text-violet-400",
  "border-rose-500/40 text-rose-600 dark:text-rose-400",
  "border-teal-500/40 text-teal-600 dark:text-teal-400",
  "border-amber-500/40 text-amber-600 dark:text-amber-400",
  "border-indigo-500/40 text-indigo-600 dark:text-indigo-400",
];

function hashToIndex(text: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function LeadCategoryBadge({ kategori }: { kategori: string | null }) {
  if (!kategori) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <Badge variant="outline" className={PALETTE[hashToIndex(kategori, PALETTE.length)]}>
      {kategori}
    </Badge>
  );
}
