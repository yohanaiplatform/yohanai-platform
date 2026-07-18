// src/components/dashboard/PropertySummary.tsx
import { SectionCard } from "@/components/ui/section-card";
import { PropertySummary as PropertySummaryType } from "@/types/dashboard";

interface PropertySummaryProps {
  data: PropertySummaryType;
}

export function PropertySummary({ data }: PropertySummaryProps) {
  const items = [
    { label: "Available", value: data.available, desc: "Ready for viewing", color: "text-green-600 dark:text-green-400" },
    { label: "Booked", value: data.booked, desc: "Pending transaction", color: "text-amber-600 dark:text-amber-400" },
    { label: "Sold", value: data.sold, desc: "Successfully closed", color: "text-blue-600 dark:text-blue-400" },
    { label: "Hold", value: data.hold, desc: "Temporarily unavailable", color: "text-gray-600 dark:text-gray-400" },
  ];

  return (
    <SectionCard title="Property Summary" description="Overview of current listing statuses">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
            <p className={`mt-2 text-3xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}