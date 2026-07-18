// src/app/(dashboard)/properties/page.tsx
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function PropertiesPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="Property"
        description="Manage property listings, availability and inventory."
      >
        <EmptyState
          title="Property Module"
          description="Property management features will be implemented in Sprint 007."
        />
      </SectionCard>
    </div>
  );
}