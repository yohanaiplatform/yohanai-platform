// src/app/(dashboard)/settings/page.tsx
import { Suspense } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { GoogleContactsConnection } from "@/components/settings/GoogleContactsConnection";
import { WhatsAppNumbersManager } from "@/components/settings/WhatsAppNumbersManager";
import { KnowledgeGapsManager } from "@/components/settings/KnowledgeGapsManager";
import { KnowledgePlacesManager } from "@/components/settings/KnowledgePlacesManager";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard title="Integrasi" description="Sambungkan akun pribadi Anda ke layanan luar.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <GoogleContactsConnection />
        </Suspense>
      </SectionCard>

      <SectionCard
        title="Kamus Kawasan (Titik Peta)"
        description="Tempel link Google Maps jalan/kawasan/patokan yang sering ditanyakan konsumen. Asisten menghitung jaraknya ke listing."
      >
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <KnowledgePlacesManager />
        </Suspense>
      </SectionCard>

      <SectionCard
        title="Celah Pengetahuan Asisten"
        description="Hal-hal yang sering membuat asisten otomatis tidak bisa menjawab. Tulis jawabannya, dan asisten langsung memakainya."
      >
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <KnowledgeGapsManager />
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
