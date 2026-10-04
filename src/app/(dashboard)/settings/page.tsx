// src/app/(dashboard)/settings/page.tsx
import { Suspense } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { GoogleContactsConnection } from "@/components/settings/GoogleContactsConnection";
import { WhatsAppNumbersManager } from "@/components/settings/WhatsAppNumbersManager";
import { KnowledgeGapsManager } from "@/components/settings/KnowledgeGapsManager";
import { ConversationInsights } from "@/components/settings/ConversationInsights";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <SectionCard title="Integrasi" description="Sambungkan akun pribadi Anda ke layanan luar.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <GoogleContactsConnection />
        </Suspense>
      </SectionCard>

      <SectionCard title="Insight Lead 7 Hari" description="Pola dari lead baru: apa yang dicari, dari mana datangnya, dan sudah sampai tahap mana.">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
          <ConversationInsights />
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
