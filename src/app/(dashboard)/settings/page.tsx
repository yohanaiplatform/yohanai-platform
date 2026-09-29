// src/app/(dashboard)/settings/page.tsx
import { Suspense } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { GoogleContactsConnection } from "@/components/settings/GoogleContactsConnection";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard title="Integrasi" description="Sambungkan akun pribadi Anda ke layanan luar.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <GoogleContactsConnection />
        </Suspense>
      </SectionCard>
    </div>
  );
}
