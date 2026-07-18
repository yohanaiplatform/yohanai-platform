// src/app/(dashboard)/crm/page.tsx
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function CRMPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="CRM"
        description="Manage leads, customers, follow-up activities and AI insights."
      >
        <EmptyState
          title="CRM Module"
          description="CRM features will be implemented in Sprint 007."
        />
      </SectionCard>
    </div>
  );
}