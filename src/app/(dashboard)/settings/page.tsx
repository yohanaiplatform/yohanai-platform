// src/app/(dashboard)/settings/page.tsx
import { Suspense } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { GoogleContactsConnection } from "@/components/settings/GoogleContactsConnection";
import { WhatsAppNumbersManager } from "@/components/settings/WhatsAppNumbersManager";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard title="Integrasi" description="Sambungkan akun pribadi Anda ke layanan luar.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <GoogleContactsConnection />
        </Suspense>
      </SectionCard>

      <SectionCard
        title="Nomor WhatsApp & Pemilik"
        description="Khusus admin -- atur nomor WA mana jadi milik agent mana untuk lead baru otomatis."
      >
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <WhatsAppNumbersManager />
        </Suspense>
      </SectionCard>
    </div>
  );
}
