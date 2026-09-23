// src/components/crm/LeadListFilters.tsx

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { LEAD_KATEGORI_OPTIONS } from "@/constants/crm";

interface LeadListFiltersProps {
  dateFrom?: string;
  dateTo?: string;
  kategori?: string;
  temperature?: string;
}

/**
 * Form native (method GET, tanpa JS) supaya filter jalan lewat searchParams
 * biasa -- konsisten dengan pola server component di halaman ini.
 *
 * temperature (dari klik tile Lead Funnel di dashboard) dibawa lewat hidden
 * input supaya tidak hilang saat form ini di-submit ulang.
 */
export function LeadListFilters({
  dateFrom,
  dateTo,
  kategori,
  temperature,
}: LeadListFiltersProps) {
  return (
    <form
      method="GET"
      className="flex flex-wrap items-end gap-3 border-b border-border pb-4"
    >
      {temperature && (
        <input type="hidden" name="temperature" value={temperature} />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="dateFrom" className="text-xs text-muted-foreground">
          Dari Tanggal
        </label>
        <Input
          id="dateFrom"
          name="dateFrom"
          type="date"
          defaultValue={dateFrom ?? ""}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dateTo" className="text-xs text-muted-foreground">
          Sampai Tanggal
        </label>
        <Input
          id="dateTo"
          name="dateTo"
          type="date"
          defaultValue={dateTo ?? ""}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="kategori" className="text-xs text-muted-foreground">
          Property / Kategori
        </label>
        <select
          id="kategori"
          name="kategori"
          defaultValue={kategori ?? ""}
          className="h-8 w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Semua Property</option>
          {LEAD_KATEGORI_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="sm">
        Terapkan
      </Button>
      <Link href="/crm" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Reset
      </Link>
    </form>
  );
}
