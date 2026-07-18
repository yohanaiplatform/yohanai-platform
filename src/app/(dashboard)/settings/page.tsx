// src/app/(dashboard)/settings/page.tsx
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="Settings"
        description="Configure platform preferences, integrations and user management."
      >
        <EmptyState
          title="Settings Module"
          description="Settings features will be implemented in Sprint 007."
        />
      </SectionCard>
    </div>
  );
}