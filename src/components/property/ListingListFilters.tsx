// src/components/property/ListingListFilters.tsx

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { PROPERTY_STATUS_OPTIONS } from "@/constants/property";

interface Category {
  id: string;
  name: string;
}

interface ListingListFiltersProps {
  categories: Category[];
  status?: string;
  categoryId?: string;
  search?: string;
  pageSize?: number;
}

/** Pola sama seperti LeadListFilters.tsx: form native GET, tanpa JS, jalan lewat searchParams. */
export function ListingListFilters({
  categories,
  status,
  categoryId,
  search,
  pageSize,
}: ListingListFiltersProps) {
  return (
    <form method="GET" className="space-y-4 border-b border-border pb-4">
      {pageSize && <input type="hidden" name="pageSize" value={pageSize} />}
      <div className="flex flex-col gap-1">
        <label htmlFor="search" className="text-sm font-medium">
          Cari
        </label>
        <div className="relative max-w-xl">
          <Input
            id="search"
            name="search"
            type="text"
            placeholder="Judul atau alamat..."
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
          <label htmlFor="status" className="text-xs text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="h-8 w-40 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Semua Status</option>
            {PROPERTY_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="categoryId" className="text-xs text-muted-foreground">
            Kategori
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" size="sm">
          Terapkan
        </Button>
        <Link href="/properties" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Reset
        </Link>
      </div>
    </form>
  );
}
