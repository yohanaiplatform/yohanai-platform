"use client";

// src/components/property/ListingLeadKategoriMatch.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LEAD_KATEGORI_OPTIONS } from "@/constants/crm";

interface ListingLeadKategoriMatchProps {
  listingId: string;
  metadata: Json;
  kategoriMatch: string[];
}

/**
 * Konfigurasi "lead mana yang masuk Laporan Pemasaran listing ini" --
 * dicocokkan lewat metadata->>kategori lead (lihat getListingReport.ts).
 * Kategori yang terlalu umum (mis. "Kons. Cari Rumah Murah") biasanya
 * TIDAK dicentang di sini -- lead seperti itu dikaitkan manual satu-satu
 * dari Lead Detail ("Kaitkan ke Listing") berdasarkan hasil percakapan WA,
 * bukan lewat kategori massal.
 */
export function ListingLeadKategoriMatch({ listingId, metadata, kategoriMatch }: ListingLeadKategoriMatchProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>(kategoriMatch);

  async function toggle(kategori: string, checked: boolean) {
    const next = checked ? [...selected, kategori] : selected.filter((k) => k !== kategori);
    setSelected(next);
    setSaving(true);

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

    const supabase = createClient();
    const { error } = await supabase
      .schema("property")
      .from("listings")
      .update({ metadata: { ...baseMetadata, lead_kategori_match: next } as unknown as Json })
      .eq("id", listingId);

    setSaving(false);
    if (error) {
      setSelected(selected);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LEAD_KATEGORI_OPTIONS.map((kategori) => (
          <div key={kategori} className="flex items-center gap-2">
            <Checkbox
              id={`kategori-${listingId}-${kategori}`}
              checked={selected.includes(kategori)}
              onCheckedChange={(checked) => toggle(kategori, checked === true)}
              disabled={saving}
            />
            <Label htmlFor={`kategori-${listingId}-${kategori}`} className="text-sm font-normal">
              {kategori}
            </Label>
          </div>
        ))}
      </div>
      {saving && <p className="text-xs text-muted-foreground">Menyimpan...</p>}
    </div>
  );
}
