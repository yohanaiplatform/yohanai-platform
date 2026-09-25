// src/components/crm/LeadListFilters.tsx

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { LEAD_KATEGORI_OPTIONS, LEAD_SUMBER_OPTIONS } from "@/constants/crm";

interface LeadListFiltersProps {
  dateFrom?: string;
  dateTo?: string;
  kategori?: string;
  sumber?: string;
  temperature?: string;
  search?: string;
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
 */
export function LeadListFilters({
  dateFrom,
  dateTo,
  kategori,
  sumber,
  temperature,
  search,
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
        {/* TODO(bi-lingual): label & placeholder perlu ikut pilihan bahasa
            begitu fitur bahasa di header aktif -- lihat docs/modules/crm.mdx. */}
        <label htmlFor="search" className="text-sm font-medium">
          Cari
        </label>
        <div className="relative max-w-xl">
          <Input
            id="search"
            name="search"
            type="text"
            placeholder="Nama, No. HP, atau lokasi (mis. Serdam, UNTAN)"
            defaultValue={search ?? ""}
            className="pr-9"
          />
          <button
            type="submit"
            aria-label="Cari"
            className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
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

        <div className="flex flex-col gap-1">
          <label htmlFor="sumber" className="text-xs text-muted-foreground">
            Sumber Informasi
          </label>
          <select
            id="sumber"
            name="sumber"
            defaultValue={sumber ?? ""}
            className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Semua Sumber</option>
            {LEAD_SUMBER_OPTIONS.map((option) => (
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
      </div>
    </form>
  );
}
