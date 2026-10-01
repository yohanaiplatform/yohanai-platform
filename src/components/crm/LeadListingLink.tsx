"use client";

// src/components/crm/LeadListingLink.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import type { ListingSelectOption } from "@/lib/property/getListings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadListingLinkProps {
  leadId: string;
  metadata: Json;
  manualListingId: string | null;
  listings: ListingSelectOption[];
}

const NONE_VALUE = "__none__";

/**
 * Kaitkan lead ini manual ke satu listing -- dipakai di Laporan Pemasaran
 * listing (lihat getListingReport.ts) untuk lead yang Kategori-nya terlalu
 * umum (mis. "Kons. Cari Rumah Murah") sehingga tidak otomatis cocok ke
 * listing manapun lewat kategori. Agen tentukan sendiri berdasarkan hasil
 * percakapan WA dengan lead ini.
 */
export function LeadListingLink({ leadId, metadata, manualListingId, listings }: LeadListingLinkProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(manualListingId ?? NONE_VALUE);

  async function handleChange(nextValue: string | null) {
    const next = nextValue ?? NONE_VALUE;
    const previous = value;
    setValue(next);
    setSaving(true);

    const baseMetadata =
      typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) ? metadata : {};

    const supabase = createClient();
    const { error } = await supabase
      .schema("customer")
      .from("leads")
      .update({
        metadata: {
          ...baseMetadata,
          manual_listing_id: next === NONE_VALUE ? null : next,
        } as unknown as Json,
      })
      .eq("id", leadId);

    setSaving(false);
    if (error) {
      setValue(previous);
      return;
    }
    router.refresh();
  }

  const selectedListing = listings.find((l) => l.id === value);

  return (
    <Select value={value} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger id={`listing-link-${leadId}`} className="h-8 text-sm">
        <SelectValue placeholder="Tidak dikaitkan">{selectedListing?.title ?? "Tidak dikaitkan"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>Tidak dikaitkan</SelectItem>
        {listings.map((listing) => (
          <SelectItem key={listing.id} value={listing.id}>
            {listing.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
