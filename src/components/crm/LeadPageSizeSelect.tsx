"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LEAD_PAGE_SIZE_OPTIONS } from "@/lib/crm/getLeads";

interface LeadPageSizeSelectProps {
  pageSize: number;
  label: string;
}

/** Ganti pageSize langsung navigate (bukan submit form filter) supaya tidak ikut mereset filter lain. */
export function LeadPageSizeSelect({ pageSize, label }: LeadPageSizeSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", e.target.value);
    params.set("page", "1");
    router.push(`/crm?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="pageSize" className="text-xs text-muted-foreground">
        {label}
      </label>
      <select
        id="pageSize"
        value={pageSize}
        onChange={handleChange}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {LEAD_PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}
