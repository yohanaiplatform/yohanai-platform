// src/components/crm/LeadListFilters.tsx

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { LEAD_KATEGORI_OPTIONS, LEAD_SUMBER_OPTIONS } from "@/constants/crm";
import type { CrmDictionary } from "@/lib/i18n/dictionaries";

interface LeadListFiltersProps {
  dateFrom?: string;
  dateTo?: string;
  kategori?: string;
  sumber?: string;
  temperature?: string;
  search?: string;
  t: CrmDictionary;
}

/**
 * Form native (method GET, tanpa JS) supaya filter jalan lewat searchParams
 * biasa -- konsisten dengan pola server component di halaman ini.
 *
 * temperature (dari klik tile Lead Funnel di dashboard) dibawa lewat hidden
 * input supaya tidak hilang saat form ini di-submit ulang.
 *
 * Search di baris sendiri di atas (bukan campur dengan filter lain) karena
 * ini yang paling sering dipakai -- tombol kaca pembesar di kanan cuma
 * submit form yang sama, bukan mekanisme terpisah.
 *
 * Opsi dropdown (kategori/sumber) sengaja TIDAK diterjemahkan -- itu nilai
 * data asli (bahasa Google Form), lihat catatan di dictionaries.ts.
 */
export function LeadListFilters({
  dateFrom,
  dateTo,
  kategori,
  sumber,
  temperature,
  search,
  t,
}: LeadListFiltersProps) {
  return (
    <form
      method="GET"
      className="space-y-4 border-b border-border pb-4"
    >
      {temperature && (
        <input type="hidden" name="temperature" value={temperature} />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="search" className="text-sm font-medium">
          {t.list.search}
        </label>
        <div className="relative max-w-xl">
          <Input
            id="search"
            name="search"
            type="text"
            placeholder={t.list.searchPlaceholder}
            defaultValue={search ?? ""}
            className="pr-9"
          />
          <button
            type="submit"
            aria-label={t.list.search}
            className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="dateFrom" className="text-xs text-muted-foreground">
            {t.list.dateFrom}
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
            {t.list.dateTo}
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
            {t.list.category}
          </label>
          <select
            id="kategori"
            name="kategori"
            defaultValue={kategori ?? ""}
            className="h-8 w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t.list.allCategory}</option>
            {LEAD_KATEGORI_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sumber" className="text-xs text-muted-foreground">
            {t.list.source}
          </label>
          <select
            id="sumber"
            name="sumber"
            defaultValue={sumber ?? ""}
            className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t.list.allSource}</option>
            {LEAD_SUMBER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" size="sm">
          {t.list.apply}
        </Button>
        <Link href="/crm" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t.list.reset}
        </Link>
      </div>
    </form>
  );
}
