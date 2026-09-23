// src/components/dashboard/LeadFunnel.tsx
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { LeadSummary } from "@/types/dashboard";

interface LeadFunnelProps {
  data: LeadSummary;
}

export function LeadFunnel({ data }: LeadFunnelProps) {
  const total =
    data.hot + data.warm + data.cold + data.closing + data.batal || 1;

  const items = [
    {
      label: "Hot",
      temperature: "hot",
      count: data.hot,
      color: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Warm",
      temperature: "warm",
      count: data.warm,
      color: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Cold",
      temperature: "cold",
      count: data.cold,
      color: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Closing",
      temperature: "closing",
      count: data.closing,
      color: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Batal",
      temperature: "batal",
      count: data.batal,
      color: "bg-neutral-500",
      text: "text-neutral-600 dark:text-neutral-400",
      bg: "bg-neutral-50 dark:bg-neutral-900",
    },
  ];

  return (
    <SectionCard
      title="Lead Funnel"
      description="Distribusi lead berdasarkan temperature -- klik untuk lihat daftarnya"
    >
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.label}
            href={`/crm?temperature=${item.temperature}`}
            className={`rounded-xl border p-4 transition-opacity hover:opacity-80 ${item.bg}`}
          >
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className={`text-sm font-medium ${item.text}`}>
                {item.label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">{item.count}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((item.count / total) * 100)}% of total
            </p>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
