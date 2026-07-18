// src/components/dashboard/LeadFunnel.tsx
import { SectionCard } from "@/components/ui/section-card";
import { LeadSummary } from "@/types/dashboard";

interface LeadFunnelProps {
  data: LeadSummary;
}

export function LeadFunnel({ data }: LeadFunnelProps) {
  const total = data.hot + data.warm + data.cold || 1;
  const items = [
    { label: "Hot", count: data.hot, color: "bg-red-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950" },
    { label: "Warm", count: data.warm, color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
    { label: "Cold", count: data.cold, color: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
  ];

  return (
    <SectionCard title="Lead Funnel" description="Distribution of leads by temperature">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{item.count}</p>
            <p className="text-xs text-muted-foreground">{Math.round((item.count / total) * 100)}% of total</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}