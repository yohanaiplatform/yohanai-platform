"use client";

// src/components/property/ListingPageSizeSelect.tsx

import { useRouter, useSearchParams } from "next/navigation";
import { LISTING_PAGE_SIZE_OPTIONS } from "@/lib/property/getListings";

interface ListingPageSizeSelectProps {
  pageSize: number;
}

/** Ganti pageSize langsung navigate (bukan submit form filter) supaya tidak ikut mereset filter lain. */
export function ListingPageSizeSelect({ pageSize }: ListingPageSizeSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", e.target.value);
    params.set("page", "1");
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="pageSize" className="text-xs text-muted-foreground">
        Per halaman
      </label>
      <select
        id="pageSize"
        value={pageSize}
        onChange={handleChange}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {LISTING_PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}
