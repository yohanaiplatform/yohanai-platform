// src/app/(dashboard)/communication/page.tsx
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function CommunicationPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard
        title="Communication"
        description="Manage WhatsApp conversations, follow-ups and broadcasts."
      >
        <EmptyState
          title="Communication Module"
          description="Communication features will be implemented in Sprint 007."
        />
      </SectionCard>
    </div>
  );
}