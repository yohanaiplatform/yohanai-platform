// src/components/crm/LeadListPagination.tsx

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LeadFilters } from "@/lib/crm/getLeads";

interface LeadListPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  filters: LeadFilters;
}

function buildHref(page: number, filters: LeadFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.kategori) params.set("kategori", filters.kategori);
  return `/crm?${params.toString()}`;
}

export function LeadListPagination({
  page,
  pageSize,
  totalCount,
  filters,
}: LeadListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Halaman {page} dari {totalPages} &middot; {totalCount} lead
      </p>
      <div className="flex gap-2">
        <Link
          href={buildHref(page - 1, filters)}
          aria-disabled={!hasPrev}
          tabIndex={hasPrev ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !hasPrev && "pointer-events-none opacity-50"
          )}
        >
          Sebelumnya
        </Link>
        <Link
          href={buildHref(page + 1, filters)}
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            !hasNext && "pointer-events-none opacity-50"
          )}
        >
          Berikutnya
        </Link>
      </div>
    </div>
  );
}
