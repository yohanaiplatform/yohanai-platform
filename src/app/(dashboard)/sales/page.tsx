// src/app/(dashboard)/sales/page.tsx
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function SalesPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="Sales"
        description="Monitor sales performance, pipeline and closing activities."
      >
        <EmptyState
          title="Sales Module"
          description="Sales management features will be implemented in Sprint 007."
        />
      </SectionCard>
    </div>
  );
}