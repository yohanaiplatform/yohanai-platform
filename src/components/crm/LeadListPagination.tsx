// src/components/crm/LeadListPagination.tsx

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeadListPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
}

export function LeadListPagination({
  page,
  pageSize,
  totalCount,
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
          href={`/crm?page=${page - 1}`}
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
          href={`/crm?page=${page + 1}`}
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
