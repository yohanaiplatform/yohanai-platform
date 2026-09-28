"use client";

// src/components/property/PropertyVisibilityToggle.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Json } from "@/types/database";

interface PropertyVisibilityToggleProps {
  listingId: string;
  metadata: Json;
  hidden: boolean;
}

/**
 * Beda dari Hapus (soft delete permanen) -- ini buat kasus sementara, mis. pemilik
 * properti tiba-tiba tidak bisa dihubungi. Listing hidden otomatis hilang dari
 * `/properties` (lihat getListings.ts) dan HARUS dicek juga oleh logika apa pun
 * yang mereferensikan listing ke lead/konsumen di masa depan (AI Agent, flyer,
 * broadcast) -- filter `metadata->>hidden` sebelum merekomendasikan listing manapun.
 */
export function PropertyVisibilityToggle({ listingId, metadata, hidden }: PropertyVisibilityToggleProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setSaving(true);
    setError(null);

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

    const supabase = createClient();
    const { error: updateError } = await supabase
      .schema("property")
      .from("listings")
      .update({ metadata: { ...baseMetadata, hidden: !hidden } })
      .eq("id", listingId);

    setSaving(false);

    if (updateError) {
      setError("Gagal mengubah visibilitas. Coba lagi.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="outline" onClick={handleToggle} disabled={saving}>
        {hidden ? (
          <>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Menampilkan..." : "Tampilkan"}
          </>
        ) : (
          <>
            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Menyembunyikan..." : "Sembunyikan"}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
